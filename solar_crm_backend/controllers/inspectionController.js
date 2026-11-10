const { ensureInspectionTable, getInspectionByProject, createInspection, updateInspection } = require('../models/inspectionModel');

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

exports.getInspection = async (req, res) => {
  try {
    const db = req.db;
    await ensureInspectionTable(db);
    const pid = await resolveNumericProjectId(db, req.params.id);
    const data = await getInspectionByProject(db, pid);
    res.json({ inspection: data });
  } catch (err) {
    console.error('getInspection error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createInspection = async (req, res) => {
  try {
    const db = req.db;
    await ensureInspectionTable(db);
    const pid = await resolveNumericProjectId(db, req.params.id);
    const existing = await getInspectionByProject(db, pid);
    if (existing) return res.status(400).json({ message: 'Inspection already exists. Use PUT to update.' });
    await createInspection(db, pid, req.body, req.user?.id || req.user?.userId);
    const data = await getInspectionByProject(db, pid);
    res.status(201).json({ message: 'Inspection created', inspection: data });
  } catch (err) {
    console.error('createInspection error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateInspection = async (req, res) => {
  try {
    const db = req.db;
    const pid = await resolveNumericProjectId(db, req.params.id);
    await updateInspection(db, pid, req.body);
    const data = await getInspectionByProject(db, pid);
    res.json({ message: 'Inspection updated', inspection: data });
  } catch (err) {
    console.error('updateInspection error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
