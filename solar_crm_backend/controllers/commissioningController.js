const { ensureCommissioningTable, getCommissioning, createCommissioning, updateCommissioning } = require('../models/commissioningModel');

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
    await ensureCommissioningTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const data = await getCommissioning(req.db, pid);
    res.json({ commissioning: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    await ensureCommissioningTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const existing = await getCommissioning(req.db, pid);
    if (existing) return res.status(400).json({ message: 'Already exists. Use PUT.' });
    await createCommissioning(req.db, pid, req.body, req.user?.id || req.user?.userId);
    const data = await getCommissioning(req.db, pid);
    res.status(201).json({ message: 'Commissioning created', commissioning: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    await updateCommissioning(req.db, pid, req.body);
    const data = await getCommissioning(req.db, pid);
    res.json({ message: 'Updated', commissioning: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
