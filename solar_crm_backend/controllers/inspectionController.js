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
    res.json({ inspection: data, data });
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

    // Check if an actual row exists in project_inspections (do not rely on getInspectionByProject fallback)
    const [rows] = await db.query(
      "SELECT id FROM project_inspections WHERE project_id = ? AND is_deleted = 0 LIMIT 1",
      [pid]
    );

    if (rows && rows.length > 0) {
      await updateInspection(db, pid, req.body);
    } else {
      await createInspection(db, pid, req.body, req.user?.id || req.user?.userId);
    }

    const data = await getInspectionByProject(db, pid);
    res.status(200).json({ message: 'Inspection saved successfully', inspection: data, data });
  } catch (err) {
    console.error('createInspection error:', err);
    res.status(500).json({ message: 'Server error: ' + (err.message || err) });
  }
};

exports.updateInspection = async (req, res) => {
  try {
    const db = req.db;
    await ensureInspectionTable(db);
    const pid = await resolveNumericProjectId(db, req.params.id);

    const [rows] = await db.query(
      "SELECT id FROM project_inspections WHERE project_id = ? AND is_deleted = 0 LIMIT 1",
      [pid]
    );

    if (rows && rows.length > 0) {
      await updateInspection(db, pid, req.body);
    } else {
      await createInspection(db, pid, req.body, req.user?.id || req.user?.userId);
    }

    const data = await getInspectionByProject(db, pid);
    res.json({ message: 'Inspection updated successfully', inspection: data, data });
  } catch (err) {
    console.error('updateInspection error:', err);
    res.status(500).json({ message: 'Server error: ' + (err.message || err) });
  }
};
