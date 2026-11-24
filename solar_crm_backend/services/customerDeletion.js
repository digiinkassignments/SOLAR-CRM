const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const root = path.resolve(__dirname, '..');
const archiveRoot = path.join(root, 'private/customer-recycle');
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const ident = (name) => {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) fail('Invalid database identifier.', 500);
  return '`' + name + '`';
};
const reserved = (name) =>
  /^(customer_recycle|customer_deletion_audit|customer_import_batches|users|roles|settings|stock_items|stock_categories|stock_alerts|crm_workflow_settings|amc_plans)$/.test(
    name
  );
const isStock = (name) => /stock_.*transaction|inventory_.*transaction/.test(name);
const refs = {
  customer_id: 'customers',
  lead_id: 'leads',
  project_id: 'projects',
  invoice_id: 'invoices',
  quotation_id: 'quotations',
  quote_id: 'quotations',
  survey_id: 'site_surveys',
  loan_id: 'solar_loans',
  tracker_id: 'subsidy_applications',
  entry_id: 'crm_field_entries',
  log_id: 'installation_logs',
  installation_log_id: 'installation_logs',
  purchase_order_id: 'purchase_orders',
  order_id: 'purchase_orders',
  plan_id: 'customer_payment_plans',
};
const ready = new WeakMap();

async function ensure(db) {
  if (!ready.has(db))
    ready.set(
      db,
      (async () => {
        await db.query(`CREATE TABLE IF NOT EXISTS customer_recycle (
      customer_id INT PRIMARY KEY, token CHAR(36) NOT NULL UNIQUE, tenant_id INT NOT NULL,
      deleted_by INT NOT NULL, deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      purge_after TIMESTAMP NOT NULL, counts_json LONGTEXT NOT NULL,
      snapshot LONGBLOB NOT NULL, state VARCHAR(20) NOT NULL DEFAULT 'recycled'
    ) ENGINE=InnoDB`);
        await db.query(`CREATE TABLE IF NOT EXISTS customer_deletion_audit (
      customer_id INT NOT NULL, deleted_by INT NOT NULL, deleted_at TIMESTAMP NOT NULL,
      counts_json LONGTEXT NOT NULL
    ) ENGINE=InnoDB`);
      })().catch((e) => {
        ready.delete(db);
        throw e;
      })
    );
  return ready.get(db);
}
function key() {
  const secret = process.env.CUSTOMER_RECYCLE_KEY || process.env.JWT_SECRET;
  if (!secret) fail('Customer recycle encryption key is not configured.', 503);
  return crypto
    .createHash('sha256')
    .update('customer-recycle-v1:' + secret)
    .digest();
}
function seal(value) {
  const iv = crypto.randomBytes(12),
    cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  return Buffer.concat([iv, ...encrypt(cipher, value)]);
}
function encrypt(cipher, value) {
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [cipher.getAuthTag(), data];
}
function open(buffer) {
  const b = Buffer.from(buffer),
    decipher = crypto.createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12));
  decipher.setAuthTag(b.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([decipher.update(b.subarray(28)), decipher.final()]).toString('utf8')
  );
}
async function schema(db) {
  const [columns] = await db.query(
    'SELECT TABLE_NAME AS tbl,COLUMN_NAME AS col,COLUMN_KEY AS pk,IS_NULLABLE AS nullable,DATA_TYPE AS type,EXTRA AS extra FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() ORDER BY ORDINAL_POSITION'
  );
  const result = {};
  for (const c of columns) {
    if (reserved(c.tbl)) continue;
    (result[c.tbl] ??= []).push(c);
  }
  const [foreign] = await db.query(
    'SELECT TABLE_NAME AS tbl,COLUMN_NAME AS col,REFERENCED_TABLE_NAME AS parent,REFERENCED_COLUMN_NAME AS target FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL'
  );
  return { tables: result, foreign, allColumns: columns };
}
function normalized(row) {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k,
      v instanceof Date
        ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')} ${String(v.getHours()).padStart(2, '0')}:${String(v.getMinutes()).padStart(2, '0')}:${String(v.getSeconds()).padStart(2, '0')}`
        : v,
    ])
  );
}
function predicate(table, row, tables) {
  const keys = tables[table].filter((c) => c.pk === 'PRI').map((c) => c.col);
  if (!keys.length) fail(`Cannot safely archive table ${table}: primary key missing.`, 409);
  return {
    sql: keys.map((k) => `${ident(k)} <=> ?`).join(' AND '),
    params: keys.map((k) => row[k]),
  };
}
async function collect(db, customerId, tenantId, lock = false) {
  const meta = await schema(db),
    { tables, foreign } = meta;
  const [[customer]] = await db.query(
    'SELECT * FROM customers WHERE id=?' + (lock ? ' FOR UPDATE' : ''),
    [customerId]
  );
  if (!customer) fail('Customer not found.', 404);
  const rows = { customers: [normalized(customer)] },
    detached = {};
  if (customer.lead_id && tables.leads) {
    const [leads] = await db.query('SELECT * FROM leads WHERE id=?' + (lock ? ' FOR UPDATE' : ''), [
      customer.lead_id,
    ]);
    rows.leads = leads.map(normalized);
  }
  let changed = true;
  for (let pass = 0; changed && pass < 30; pass++) {
    changed = false;
    for (const [table, cols] of Object.entries(tables)) {
      if (table === 'customers') continue;
      const relations = cols.flatMap((c) => {
        if (
          ['crm_duplicate_links', 'crm_duplicate_audit'].includes(table) &&
          ['record_id', 'original_id'].includes(c.col)
        ) {
          return ['customer', 'lead', 'project'].flatMap((type) => {
            const parent = { customer: 'customers', lead: 'leads', project: 'projects' }[type];
            return rows[parent]?.length
              ? [
                  {
                    col: c.col,
                    parent,
                    target: 'id',
                    typeValue: type,
                    typeColumn: c.col === 'record_id' ? 'record_type' : 'original_type',
                  },
                ]
              : [];
          });
        }
        const fk = foreign.find((f) => f.tbl === table && f.col === c.col);
        let parent = fk?.parent || refs[c.col],
          target = fk?.target || 'id';
        if (c.col === 'reference_id' && table === 'notifications')
          return [
            { col: c.col, parent: 'customers', target: 'id', noticeTypes: ['customer_collection_due'] },
            {
              col: c.col,
              parent: 'leads',
              target: 'id',
              noticeTypes: [
                'followup_due',
                'team_followup_due',
                'site_visit_reminder',
                'lead_duplicate',
                'lead_enquiry',
              ],
            },
            {
              col: c.col,
              parent: 'crm_field_tasks',
              target: 'id',
              noticeTypes: ['field_task_due'],
            },
          ].filter((r) => rows[r.parent]?.length);
        if (c.col === 'reference_id' && isStock(table))
          return ['LEAD', 'PROJECT'].flatMap((type) =>
            rows[type === 'LEAD' ? 'leads' : 'projects']?.length
              ? [
                  {
                    col: c.col,
                    parent: type === 'LEAD' ? 'leads' : 'projects',
                    target: 'id',
                    refType: type,
                  },
                ]
              : []
          );
        if (c.col === 'resource_id' && cols.some((x) => x.col === 'resource_type'))
          return ['survey', 'project'].flatMap((type) =>
            rows[type === 'survey' ? 'site_surveys' : 'projects']?.length
              ? [
                  {
                    col: c.col,
                    parent: type === 'survey' ? 'site_surveys' : 'projects',
                    target: 'id',
                    type,
                  },
                ]
              : []
          );
        return parent && rows[parent]?.length ? [{ col: c.col, parent, target }] : [];
      });
      const clauses = [],
        params = [];
      for (const relation of relations) {
        const values = [
          ...new Set(rows[relation.parent].map((r) => r[relation.target]).filter((v) => v != null)),
        ];
        if (values.length) {
          clauses.push(
            `(${ident(relation.col)} IN (?)${relation.type ? ' AND resource_type=?' : relation.refType ? ' AND reference_type=?' : relation.noticeTypes ? ' AND type IN (?)' : relation.typeColumn ? ` AND ${ident(relation.typeColumn)}=?` : ''})`
          );
          params.push(values);
          if (relation.type) params.push(relation.type);
          if (relation.refType) params.push(relation.refType);
          if (relation.noticeTypes) params.push(relation.noticeTypes);
          if (relation.typeColumn) params.push(relation.typeValue);
        }
      }
      // WhatsApp provider logs may predate relational customer IDs.
      if (/whatsapp|message_logs|integration_messages/.test(table)) {
        for (const name of ['phone', 'phone_number', 'mobile_number', 'recipient', 'to_number'])
          if (cols.some((c) => c.col === name) && customer.mobile_number) {
            clauses.push(`RIGHT(REGEXP_REPLACE(${ident(name)},'[^0-9]',''),10)=?`);
            params.push(String(customer.mobile_number).replace(/\D/g, '').slice(-10));
          }
      }
      if (table === 'crm_integration_events' && customer.mobile_number) {
        clauses.push("(provider='whatsapp' AND detail REGEXP ?)");
        params.push(
          'recipient: [0-9]*' + String(customer.mobile_number).replace(/\D/g, '').slice(-10) + ';'
        );
      }
      if (!clauses.length) continue;
      const [found] = await db.query(
        `SELECT * FROM ${ident(table)} WHERE ${clauses.join(' OR ')}${lock ? ' FOR UPDATE' : ''}`,
        params
      );
      const dest = isStock(table) ? detached : rows;
      if (found.length > (dest[table]?.length || 0)) {
        dest[table] = found.map(normalized);
        changed = true;
      }
    }
  }
  if (changed) fail('Customer dependency graph is too deep to safely archive.', 409);
  for (const [table, records] of Object.entries({ ...rows, ...detached }))
    for (const row of records) predicate(table, row, tables);
  // A relationship shared with another customer must not be silently removed.
  const leads = rows.leads?.map((r) => r.id) || [];
  if (leads.length) {
    const [shared] = await db.query('SELECT id FROM customers WHERE id<>? AND lead_id IN (?)', [
      customerId,
      leads,
    ]);
    if (shared.length)
      fail(
        'A linked lead belongs to another customer. Resolve the shared link before deletion.',
        409
      );
  }
  for (const records of Object.values(rows))
    for (const row of records)
      if (row.customer_id != null && Number(row.customer_id) !== Number(customerId))
        fail(
          'A linked record belongs to another customer. Resolve its links before deletion.',
          409
        );
  const files = new Set();
  const scan = (value, field = '') => {
    if (/logo|company_(name|address|email|phone)/i.test(field)) return;
    if (typeof value === 'string') {
      if (
        field &&
        !/file|photo|document|image|attachment|signature|url|path|snapshot|data_json|dossier/i.test(
          field
        )
      )
        return;
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          scan(JSON.parse(value), field);
        } catch {}
      }
      const searchable = value.startsWith('uploads/') ? '/' + value : value;
      for (const match of searchable.matchAll(
        /(?:https?:\/\/[^\s"'<>]+)?\/(?:api\/)?uploads\/[^\s"'<>\]})]+/g
      )) {
        let relative;
        try {
          relative = decodeURIComponent(
            match[0]
              .replace(/^https?:\/\/[^/]+/, '')
              .replace(/^\/api/, '')
              .replace(/^\//, '')
          );
        } catch {
          continue;
        }
        const file = path.resolve(root, relative);
        if (file.startsWith(path.join(root, 'uploads') + path.sep))
          files.add(path.relative(root, file));
      }
    } else if (Array.isArray(value)) value.forEach((v) => scan(v));
    else if (value && typeof value === 'object')
      Object.entries(value).forEach(([k, v]) => scan(v, k));
  };
  Object.values(rows)
    .flat()
    .forEach((row) => scan(row));
  for (const table of ['survey_documents', 'crm_field_files'])
    for (const row of rows[table] || []) {
      if (!/^[\w.-]+$/.test(row.stored_name || '')) continue;
      files.add(
        table === 'survey_documents'
          ? path.join('private', 'survey-documents', String(tenantId), row.stored_name)
          : path.join('private', 'field', row.stored_name)
      );
    }
  const snapshot = {
    rows,
    detached,
    files: [...files],
    meta,
    customerId: Number(customerId),
    tenantId: Number(tenantId),
  };
  snapshot.counts = counts(snapshot);
  return snapshot;
}
function counts(snapshot) {
  const rows = snapshot.rows;
  const count = (pattern) =>
    Object.entries(rows)
      .filter(([name]) => pattern.test(name))
      .reduce((n, [, r]) => n + r.length, 0);
  return {
    leads: rows.leads?.length || 0,
    projects: rows.projects?.length || 0,
    documents: count(/document|crm_field_files/),
    quotations: rows.quotations?.length || 0,
    invoices: rows.invoices?.length || 0,
    payments:
      count(/^invoice_payments$|^customer_refunds$/) +
      (rows.customer_opening_records || []).reduce(
        (s, r) =>
          s + (Number(r.amount_paid) > 0 ? 1 : 0) + (Number(r.refund_paid_amount) > 0 ? 1 : 0),
        0
      ),
    loans:
      (rows.solar_loans?.length || 0) +
      (rows.customer_opening_records || []).filter(
        (r) => Number(r.loan_disbursed_amount) > 0 || Number(r.loan_sanctioned_amount) > 0
      ).length,
    subsidies: rows.subsidy_applications?.length || 0,
    amc_contracts: rows.project_warranty_amc?.length || 0,
    whatsapp_logs:
      count(/whatsapp|message_logs|integration_messages/) +
      (rows.crm_integration_events || []).filter((r) => r.provider === 'whatsapp').length,
    files: snapshot.files.length,
    stock_transactions: Object.values(snapshot.detached).reduce((s, r) => s + r.length, 0),
    other_records: count(/.*/) - (rows.customers?.length || 0),
  };
}
function fingerprint(snapshot) {
  return crypto
    .createHmac('sha256', key())
    .update(JSON.stringify([snapshot.rows, snapshot.detached, snapshot.files.sort()]))
    .digest('hex');
}
async function checkScope(db, snap, user) {
  if (Number(user.role_id) === 2 && snap.rows.leads?.length) {
    const [outside] = await db.query(
      'SELECT id FROM leads WHERE id IN (?) AND (assigned_to IS NULL OR assigned_to NOT IN (SELECT id FROM users WHERE manager_id=? AND role_id=3 AND is_deleted=0))',
      [snap.rows.leads.map((r) => r.id), user.id]
    );
    if (outside.length)
      fail('Some linked records are outside your team. Ask an Admin to review this customer.', 403);
  }
}
async function preview(db, id, user, tenant) {
  await require('./customerWorkspace').accessibleCustomer(db, id, user);
  const snapshot = await collect(db, id, tenant);
  await checkScope(db, snapshot, user);
  return {
    counts: snapshot.counts,
    preview_token: fingerprint(snapshot),
    financial_warning: snapshot.counts.invoices > 0 || snapshot.counts.payments > 0,
    customer_name: snapshot.rows.customers[0].customer_name,
  };
}
function authorize(user) {
  if (![1, 2].includes(Number(user.role_id)))
    fail('Only Admins and Managers can delete or restore customers.', 403);
}
async function archive(db, id, body, user, tenant) {
  authorize(user);
  await ensure(db);
  await require('./customerWorkspace').accessibleCustomer(db, id, user);
  if (
    typeof body.reason !== 'string' ||
    !String(body.reason || '').trim() ||
    String(body.reason).length > 1000
  )
    fail('Deletion reason is required (up to 1000 characters).');
  const c = await db.getConnection(),
    token = crypto.randomUUID();
  let snap,
    committed = false,
    cleanRollback = false;
  try {
    await c.beginTransaction();
    await c.query('SELECT id FROM customers WHERE id=? FOR UPDATE', [id]);
    snap = await collect(c, id, tenant, true);
    await checkScope(c, snap, user);

    if (body.confirm_name !== snap.rows.customers[0].customer_name)
      fail('Type the exact customer name to confirm.');
    if (body.preview_token !== fingerprint(snap))
      fail('Linked records changed. Refresh the deletion preview and export again.', 409);
    await verifyFiles(c, snap);
    snap.reason = String(body.reason).trim();
    await fs.mkdir(path.join(archiveRoot, token), { recursive: true, mode: 0o700 });
    // Persist a recovery journal before moving any files. Outside the public uploads root.
    await fs.writeFile(path.join(archiveRoot, token, 'journal.enc'), seal(snap), { mode: 0o600 });
    for (const [index, relative] of snap.files.entries()) {
      try {
        await fs.rename(path.join(root, relative), path.join(archiveRoot, token, String(index)));
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
    }
    for (const [table, rows] of Object.entries(snap.detached))
      for (const row of rows) {
        const p = predicate(table, row, snap.meta.tables);
        const cols = snap.meta.tables[table].filter(
          (col) =>
            col.pk !== 'PRI' &&
            (refs[col.col] ||
              col.col === 'reference_id' ||
              /customer.*name|phone|mobile|email|remark|notes|description|reference|metadata/i.test(
                col.col
              ))
        );
        const changes = cols.map(
          (col) =>
            `${ident(col.col)}=${col.nullable === 'YES' ? 'NULL' : /id$/.test(col.col) ? '0' : "''"}`
        );
        if (changes.length)
          await c.query(`UPDATE ${ident(table)} SET ${changes.join(',')} WHERE ${p.sql}`, p.params);
      }
    // Break nullable cycles only inside the captured graph; quantities never change.
    for (const f of snap.meta.foreign) {
      if (
        !snap.rows[f.tbl] ||
        !snap.rows[f.parent] ||
        !snap.meta.tables[f.tbl]?.some((col) => col.col === f.col && col.nullable === 'YES')
      )
        continue;
      for (const row of snap.rows[f.tbl]) {
        const p = predicate(f.tbl, row, snap.meta.tables);
        await c.query(`UPDATE ${ident(f.tbl)} SET ${ident(f.col)}=NULL WHERE ${p.sql}`, p.params);
      }
    }
    let pending = Object.keys(snap.rows);
    while (pending.length) {
      const next = [];
      let progress = false;
      for (const table of pending) {
        try {
          for (const row of snap.rows[table]) {
            const p = predicate(table, row, snap.meta.tables);
            await c.query(`DELETE FROM ${ident(table)} WHERE ${p.sql}`, p.params);
          }
          progress = true;
        } catch (e) {
          if (e.code === 'ER_ROW_IS_REFERENCED_2' || e.code === 'ER_ROW_IS_REFERENCED')
            next.push(table);
          else throw e;
        }
      }
      if (!progress) fail('Linked records could not be safely archived. Nothing was deleted.', 409);
      pending = next;
    }
    await c.query(
      'INSERT INTO customer_recycle(customer_id,token,tenant_id,deleted_by,purge_after,counts_json,snapshot) VALUES (?,?,?,?,DATE_ADD(NOW(),INTERVAL 30 DAY),?,?)',
      [id, token, tenant, user.id, JSON.stringify(snap.counts), seal(snap)]
    );
    await c.commit();
    committed = true;
    return { customer_id: Number(id), undo_days: 30 };
  } catch (e) {
    await c.rollback();
    if (snap && !committed) await restoreFiles(snap, token);
    cleanRollback = true;
    throw e;
  } finally {
    c.release();
    if (!committed && cleanRollback)
      await fs.rm(path.join(archiveRoot, token), { recursive: true, force: true });
  }
}
async function verifyFiles(db, snap) {
  // Never move a shared company, stock or another customer's file into this bin.
  const grouped = {};
  for (const col of snap.meta.allColumns || []) {
    if (
      ['customer_recycle', 'customer_deletion_audit'].includes(col.tbl) ||
      !/char|text|json/.test(col.type || '')
    )
      continue;
    (grouped[col.tbl] ??= []).push(col);
  }
  for (const relative of snap.files) {
    const file = path.resolve(root, relative);
    const permitted = [
      path.join(root, 'uploads') + path.sep,
      path.join(root, 'private/survey-documents', String(snap.tenantId)) + path.sep,
      path.join(root, 'private/field') + path.sep,
    ];
    if (!permitted.some((prefix) => file.startsWith(prefix)))
      fail('Unsafe file path in customer records.', 409);
    let stat;
    try {
      stat = await fs.lstat(file);
    } catch (e) {
      if (e.code === 'ENOENT') continue;
      throw e;
    }
    if (!stat.isFile() || stat.isSymbolicLink())
      fail('A customer file is not a regular owned upload.', 409);
    const text = relative.replaceAll('\\', '/');
    for (const [table, cols] of Object.entries(grouped)) {
      const params = cols.map(() => '%' + text + '%');
      let sql = `SELECT 1 FROM ${ident(table)} WHERE (${cols.map((col) => `CAST(${ident(col.col)} AS CHAR) LIKE ?`).join(' OR ')})`;
      const own = snap.rows[table] || snap.detached[table] || [];
      if (own.length) {
        const conditions = own.map((row) => {
          const p = predicate(table, row, snap.meta.tables);
          params.push(...p.params);
          return '(' + p.sql + ')';
        });
        sql += ' AND NOT (' + conditions.join(' OR ') + ')';
      }
      const [shared] = await db.query(sql + ' LIMIT 1', params);
      if (shared.length)
        fail(
          'An uploaded file is shared with other records. Resolve the shared file link before deleting this customer.',
          409
        );
    }
  }
}
async function restoreFiles(snap, token, moved = []) {
  for (const [index, relative] of snap.files.entries()) {
    const destination = path.resolve(root, relative);
    if (!destination.startsWith(root + path.sep)) fail('Invalid archived file path.', 500);
    try {
      await fs.access(path.join(archiveRoot, token, String(index)));
      try {
        await fs.access(destination);
        fail(
          'An archived file path is already in use. Contact your administrator before restoring.',
          409
        );
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.rename(path.join(archiveRoot, token, String(index)), destination);
      moved.push(index);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
}
async function list(db, user) {
  authorize(user);
  await ensure(db);
  const [rows] = await db.query(
    'SELECT customer_id,deleted_by,deleted_at,purge_after,counts_json FROM customer_recycle WHERE purge_after>NOW()' +
      (Number(user.role_id) === 2 ? ' AND deleted_by=?' : '') +
      ' ORDER BY deleted_at DESC',
    Number(user.role_id) === 2 ? [user.id] : []
  );
  return rows.map((row) => ({
    ...row,
    counts: JSON.parse(row.counts_json),
    counts_json: undefined,
  }));
}
async function restore(db, id, user) {
  authorize(user);
  await ensure(db);
  const c = await db.getConnection();
  let record,
    snap,
    committed = false;
  const moved = [];
  try {
    await c.beginTransaction();
    [[record]] = await c.query(
      'SELECT * FROM customer_recycle WHERE customer_id=? AND purge_after>NOW() FOR UPDATE',
      [id]
    );
    if (!record || (Number(user.role_id) === 2 && Number(record.deleted_by) !== Number(user.id)))
      fail('Recoverable customer not found.', 404);
    snap = open(record.snapshot);
    const deferred = [];
    let pending = Object.keys(snap.rows);
    while (pending.length) {
      let progress = false;
      const next = [];
      for (const table of pending) {
        const deferredStart = deferred.length;
        await c.query('SAVEPOINT restore_table');
        try {
          for (const original of snap.rows[table]) {
            const row = { ...original };
            for (const f of snap.meta.foreign.filter(
              (f) =>
                f.tbl === table &&
                snap.rows[f.parent] &&
                snap.meta.tables[table].some((col) => col.col === f.col && col.nullable === 'YES')
            )) {
              deferred.push({ table, row: original, col: f.col, value: row[f.col] });
              row[f.col] = null;
            }
            const cols = snap.meta.tables[table]
              .filter(
                (col) => Object.hasOwn(row, col.col) && !String(col.extra).includes('GENERATED')
              )
              .map((col) => col.col);
            await c.query(
              `INSERT INTO ${ident(table)} (${cols.map(ident).join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
              cols.map((col) => row[col])
            );
          }
          progress = true;
        } catch (e) {
          await c.query('ROLLBACK TO SAVEPOINT restore_table');
          deferred.splice(deferredStart);
          if (e.code === 'ER_NO_REFERENCED_ROW_2') next.push(table);
          else throw e;
        }
      }
      if (!progress) fail('Linked records could not be restored safely.', 409);
      pending = next;
    }
    for (const item of deferred) {
      const p = predicate(item.table, item.row, snap.meta.tables);
      await c.query(`UPDATE ${ident(item.table)} SET ${ident(item.col)}=? WHERE ${p.sql}`, [
        item.value,
        ...p.params,
      ]);
    }
    for (const [table, rows] of Object.entries(snap.detached))
      for (const row of rows) {
        const p = predicate(table, row, snap.meta.tables);
        const cols = Object.keys(row).filter(
          (col) =>
            snap.meta.tables[table].some((c) => c.col === col && c.pk !== 'PRI') &&
            (refs[col] ||
              col === 'reference_id' ||
              /customer.*name|phone|mobile|email|remark|notes|description|reference|metadata/i.test(
                col
              ))
        );
        if (cols.length)
          await c.query(
            `UPDATE ${ident(table)} SET ${cols.map((col) => `${ident(col)}=?`).join(',')} WHERE ${p.sql}`,
            [...cols.map((col) => row[col]), ...p.params]
          );
      }
    await restoreFiles(snap, record.token, moved);
    await c.query('DELETE FROM customer_recycle WHERE customer_id=?', [id]);
    await c.commit();
    committed = true;
    await fs.rm(path.join(archiveRoot, record.token), { recursive: true, force: true });
    return { customer_id: Number(id) };
  } catch (e) {
    if (!committed) {
      await c.rollback();
      if (record && snap)
        for (const index of moved)
          await fs.rename(
            path.join(root, snap.files[index]),
            path.join(archiveRoot, record.token, String(index))
          );
    }
    throw e;
  } finally {
    c.release();
  }
}
async function purge(db) {
  await ensure(db);
  const c = await db.getConnection();
  try {
    const [rows] = await c.query(
      'SELECT customer_id FROM customer_recycle WHERE purge_after<=NOW() LIMIT 25'
    );
    for (const row of rows) {
      await c.beginTransaction();
      const [[record]] = await c.query(
        'SELECT * FROM customer_recycle WHERE customer_id=? AND purge_after<=NOW() FOR UPDATE',
        [row.customer_id]
      );
      if (!record) {
        await c.rollback();
        continue;
      }
      await fs.rm(path.join(archiveRoot, record.token), { recursive: true, force: true });
      await c.query(
        'INSERT INTO customer_deletion_audit(customer_id,deleted_by,deleted_at,counts_json) VALUES (?,?,?,?)',
        [record.customer_id, record.deleted_by, record.deleted_at, record.counts_json]
      );
      await c.query('DELETE FROM customer_recycle WHERE customer_id=?', [record.customer_id]);
      await c.commit();
    }
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
async function recover(db, tenantId) {
  await ensure(db);
  let directories = [];
  try {
    directories = await fs.readdir(archiveRoot);
  } catch (e) {
    if (e.code === 'ENOENT') return;
    throw e;
  }
  for (const token of directories) {
    if (!/^[a-f0-9-]{36}$/.test(token)) continue;
    const journal = path.join(archiveRoot, token, 'journal.enc');
    let snap;
    try {
      const stat = await fs.stat(journal);
      if (Date.now() - stat.mtimeMs < 3600000) continue;
      snap = open(await fs.readFile(journal));
    } catch (e) {
      if (e.code === 'ENOENT') continue;
      throw e;
    }
    if (Number(snap.tenantId) !== Number(tenantId)) continue;
    const [[record]] = await db.query('SELECT token FROM customer_recycle WHERE token=?', [token]);
    if (record) continue;
    const [[customer]] = await db.query('SELECT id FROM customers WHERE id=?', [snap.customerId]);
    if (customer) await restoreFiles(snap, token);
    await fs.rm(path.join(archiveRoot, token), { recursive: true, force: true });
  }
}
async function reservedCodeNumber(db, year) {
  await ensure(db);
  const [rows] = await db.query('SELECT snapshot FROM customer_recycle');
  let max = 1000;
  for (const row of rows) {
    const code = open(row.snapshot).rows.customers[0].customer_code;
    const match = String(code).match(new RegExp('^CUST-' + Number(year) + '-([0-9]+)$'));
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
}
module.exports = {
  checkScope,
  reservedCodeNumber,
  recover,
  ensure,
  collect,
  counts,
  fingerprint,
  preview,
  archive,
  list,
  restore,
  purge,
  seal,
  open,
  ident,
};
