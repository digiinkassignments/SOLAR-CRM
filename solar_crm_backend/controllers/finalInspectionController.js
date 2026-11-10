const { ensureFinalInspectionTable, getFinalInspection, createFinalInspection, updateFinalInspection } = require('../models/finalInspectionModel');

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
    await ensureFinalInspectionTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const data = await getFinalInspection(req.db, pid);
    res.json({ finalInspection: data, inspection: data, data: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    await ensureFinalInspectionTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const existing = await getFinalInspection(req.db, pid);
    if (existing) {
      await updateFinalInspection(req.db, pid, req.body);
    } else {
      await createFinalInspection(req.db, pid, req.body, req.user?.id || req.user?.userId);
    }
    const data = await getFinalInspection(req.db, pid);
    res.status(201).json({ message: 'Final inspection saved', finalInspection: data, inspection: data, data: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.update = async (req, res) => {
  try {
    await ensureFinalInspectionTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const existing = await getFinalInspection(req.db, pid);
    if (existing) {
      await updateFinalInspection(req.db, pid, req.body);
    } else {
      await createFinalInspection(req.db, pid, req.body, req.user?.id || req.user?.userId);
    }
    const data = await getFinalInspection(req.db, pid);
    res.json({ message: 'Updated', finalInspection: data, inspection: data, data: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};
