const { ensureHandoverTable, getHandover, createHandover, updateHandover } = require('../models/handoverModel');

const resolveNumericProjectId = async (db, idOrUuid) => {
  if (!idOrUuid) return null;
  if (/^\d+$/.test(String(idOrUuid))) {
    return parseInt(idOrUuid, 10);
  }
  const [rows] = await db.query(
    "SELECT id FROM projects WHERE project_uuid = ? OR project_number = ? LIMIT 1",
    [idOrUuid, idOrUuid]
  );
  return rows[0]?.id || idOrUuid;
};

exports.get = async (req, res) => {
  try {
    await ensureHandoverTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const data = await getHandover(req.db, pid);
    res.json({ handover: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  return save(req, res, true);
};

exports.update = async (req, res) => {
  return save(req, res, false);
};

async function save(req, res, create) {
  let connection;
  try {
    const sync = require('../services/subsidySync');
    const rules = require('../services/subsidyRules');
    await sync.prepare(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    connection = await req.db.getConnection();
    require('../models/handoverModel').markPrepared(connection);
    sync.markPreparedConnection(connection);
    await connection.beginTransaction();
    const [[project]] = await connection.query('SELECT * FROM projects WHERE id=? AND is_deleted=0 FOR UPDATE', [pid]);
    if (!project) throw Object.assign(new Error('Project not found.'), { status: 404 });
    const existing = await getHandover(connection, pid);
    if (create && existing) throw Object.assign(new Error('Already exists. Use PUT.'), { status: 409 });
    if (!create && !existing) throw Object.assign(new Error('Save a handover record first.'), { status: 404 });
    const payload = { ...existing, ...req.body };
    if (existing?.handover_status === 'Completed') {
      if (payload.handover_status !== 'Completed')
        throw Object.assign(new Error('Completed handover cannot be reopened through a subsidy correction.'), { status: 409 });
      if (rules.dateOnly(existing.handover_date) !== rules.dateOnly(payload.handover_date))
        throw Object.assign(new Error('Completed handover date is locked to protect the warranty start date.'), { status: 409 });
    }
    if (payload.handover_status === 'Completed') {
      await sync.assertHandover(connection, pid, payload);
      payload.warranty_start_date = rules.dateOnly(payload.handover_date);
    }
    if (create) await createHandover(connection, pid, payload, req.user.id);
    else await updateHandover(connection, pid, payload);
    const [[tracker]] = await connection.query('SELECT * FROM subsidy_applications WHERE project_id=? FOR UPDATE', [pid]);
    await sync.syncLocked(connection, project, tracker, req.user.id);
    const data = await getHandover(connection, pid);
    await connection.commit();
    res.status(create ? 201 : 200).json({ message: 'Handover saved', handover: data });
  } catch (err) {
    if (connection) await connection.rollback();
    if (!err.status) console.error('Handover save:', err.code || err.message);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Unable to save handover. Please retry.' });
  } finally { if (connection) connection.release(); }
}
