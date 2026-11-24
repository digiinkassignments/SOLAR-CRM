const service = require('../services/duplicateRecords');
const limits = new Map();
const errorResponse = (res, error) =>
  res
    .status(error.status || 500)
    .json({
      success: false,
      message: error.status ? error.message : 'Duplicate checking is unavailable. Please retry.',
    });

exports.search = async (req, res) => {
  try {
    const key = `${req.clientInfo?.id}:${req.user.id}`;
    let limit = limits.get(key);
    if (!limit || Date.now() > limit.until) {
      limit = { count: 0, until: Date.now() + 60000 };
      limits.set(key, limit);
    }
    if (++limit.count > 120) service.fail('Too many checks. Please wait a moment.', 429);
    if (limits.size > 10000)
      for (const [k, value] of limits) if (value.until < Date.now()) limits.delete(k);
    const query = { ...req.query };
    if (query.exclude_id) {
      if (query.exclude_type === 'lead') {
        const allowed = await require('../models/leadModel').isLeadAccessibleByUser(
          query.exclude_id,
          req.user.role_id,
          req.user.id,
          req.db
        );
        if (!allowed) service.fail('Record not available.', 403);
      } else if (query.exclude_type === 'customer') {
        await require('../services/customerWorkspace').accessibleCustomer(
          req.db,
          query.exclude_id,
          req.user
        );
      } else service.fail('Invalid record type.');
    }
    res.json({
      success: true,
      ...(await service.search(req.db, query, { ...req.user, portal_role: req.portalRole })),
    });
  } catch (error) {
    errorResponse(res, error);
  }
};

exports.report = async (req, res) => {
  try {
    await service.ensure(req.db);
    const [rows] = await req.db.query(`SELECT d.*,u.full_name created_by_name,
      CASE WHEN d.record_type='lead' THEN l.customer_name ELSE c.customer_name END record_name,
      ol.customer_name original_lead_name,oc.customer_name original_customer_name,oc.lead_id original_customer_lead_id,op.customer_name original_project_name
      FROM crm_duplicate_links d LEFT JOIN users u ON d.created_by=u.id
      LEFT JOIN leads l ON d.record_type='lead' AND l.id=d.record_id AND l.is_deleted=0
      LEFT JOIN customers c ON d.record_type='customer' AND c.id=d.record_id
      LEFT JOIN leads ol ON d.original_type='lead' AND ol.id=d.original_id AND ol.is_deleted=0
      LEFT JOIN customers oc ON d.original_type='customer' AND oc.id=d.original_id
      LEFT JOIN projects op ON d.original_type='project' AND op.id=d.original_id AND op.is_deleted=0
      WHERE d.resolved_at IS NULL AND (l.id IS NOT NULL OR c.id IS NOT NULL)
      ORDER BY d.id DESC LIMIT 200`);
    res.json({ success: true, data: rows });
  } catch (error) {
    errorResponse(res, error);
  }
};

exports.merge = async (req, res) => {
  let connection;
  try {
    const source = Number(req.body.source_id),
      target = Number(req.body.target_id);
    if (
      !Number.isSafeInteger(source) ||
      !Number.isSafeInteger(target) ||
      source < 1 ||
      target < 1 ||
      source === target
    )
      service.fail('Select two different leads.');
    if (
      req.body.confirm !== true ||
      !String(req.body.reason || '').trim() ||
      String(req.body.reason).length > 1000
    )
      service.fail('Confirm the merge and enter a reason (up to 1000 characters).');
    await service.ensure(req.db);
    connection = await req.db.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT * FROM leads WHERE id IN (?,?) AND is_deleted=0 ORDER BY id FOR UPDATE',
      [source, target]
    );
    if (rows.length !== 2) service.fail('Both leads must be active.', 404);
    const from = rows.find((r) => Number(r.id) === source),
      to = rows.find((r) => Number(r.id) === target);
    if (service.normalize(from.mobile_number) !== service.normalize(to.mobile_number))
      service.fail('Only leads with the same primary mobile number can be merged.');
    const [customers] = await connection.query(
      'SELECT id FROM customers WHERE lead_id IN (?,?) OR id IN (?,?) FOR UPDATE',
      [source, target, from.customer_id || 0, to.customer_id || 0]
    );
    if (customers.length > 1)
      service.fail(
        'These leads have separate customer accounts. Reconcile customer and financial records before merging; nothing was changed.',
        409
      );
    const [columns] = await connection.query(
      "SELECT TABLE_NAME tbl FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='lead_id' AND TABLE_NAME<>'leads'"
    );
    for (const { tbl } of columns) {
      if (!/^[a-zA-Z0-9_]+$/.test(tbl)) continue;
      await connection.query(`UPDATE \`${tbl}\` SET lead_id=? WHERE lead_id=?`, [target, source]);
    }
    // Polymorphic field-work evidence is not covered by a lead_id foreign key.
    const [fieldTables] = await connection.query(
      "SELECT TABLE_NAME tbl FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND COLUMN_NAME IN ('subject_type','subject_id') GROUP BY TABLE_NAME HAVING COUNT(*)=2"
    );
    for (const { tbl } of fieldTables)
      if (/^[a-zA-Z0-9_]+$/.test(tbl))
        await connection.query(
          `UPDATE \`${tbl}\` SET subject_id=? WHERE subject_type='lead' AND subject_id=?`,
          [target, source]
        );
    await connection.query(
      "UPDATE leads SET remark=CONCAT_WS(CHAR(10),NULLIF(remark,''),?),customer_id=COALESCE(customer_id,?) WHERE id=?",
      [
        `Merged ${from.lead_code}: ${from.remark || ''}`,
        from.customer_id || customers[0]?.id || null,
        target,
      ]
    );
    await connection.query(
      "INSERT INTO lead_activity_logs(lead_id,action_type,remark,performed_by) VALUES (?,'Leads Merged',?,?)",
      [target, `Lead #${source} merged into #${target}. ${req.body.reason}`, req.user.id]
    );
    await connection.query('UPDATE leads SET is_deleted=1 WHERE id=?', [source]);
    await connection.query(
      "UPDATE crm_duplicate_links SET resolved_at=NOW() WHERE record_type='lead' AND record_id=?",
      [source]
    );
    await connection.query(
      "UPDATE crm_duplicate_links SET original_id=? WHERE original_type='lead' AND original_id=? AND resolved_at IS NULL",
      [target, source]
    );
    await connection.query(
      "INSERT INTO crm_duplicate_audit(action,record_type,record_id,original_type,original_id,reason,performed_by) VALUES ('merge','lead',?,'lead',?,?,?)",
      [source, target, req.body.reason, req.user.id]
    );
    await connection.commit();
    res.json({
      success: true,
      message: 'Leads merged. Related records, timeline, notes and uploaded files were retained.',
      target_id: target,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (['ER_DUP_ENTRY', 'ER_ROW_IS_REFERENCED_2'].includes(error.code)) {
      error.status = 409;
      error.message = 'Related records conflict. Merge was rolled back; no records were lost.';
    }
    errorResponse(res, error);
  } finally {
    connection?.release();
  }
};
