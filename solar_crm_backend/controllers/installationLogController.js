const {
  ensureInstallationLogsTable,
  getAllLogs,
  createLog,
  updateLog,
  saveLogPhotos
} = require('../models/installationLogModel');

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

exports.getLogs = async (req, res) => {
  try {
    await ensureInstallationLogsTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const data = await getAllLogs(req.db, pid);
    res.json(data);
  } catch (err) {
    console.error('getLogs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createLog = async (req, res) => {
  try {
    await ensureInstallationLogsTable(req.db);
    if (!req.body.work_done) return res.status(400).json({ message: 'work_done is required' });
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const id = await createLog(req.db, pid, req.body, req.user?.id || req.user?.userId);
    const data = await getAllLogs(req.db, pid);
    res.status(201).json({ message: 'Log created', id, ...data });
  } catch (err) {
    console.error('createLog error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLog = async (req, res) => {
  try {
    await ensureInstallationLogsTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    await updateLog(req.db, req.params.logId, pid, req.body);
    const data = await getAllLogs(req.db, pid);
    res.json({ message: 'Log updated', ...data });
  } catch (err) {
    console.error('updateLog error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadPhotos = async (req, res) => {
  try {
    await ensureInstallationLogsTable(req.db);
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'No photos uploaded.' });
    }
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const photoUrls = files.map((f) => `/uploads/installation/${f.filename}`);
    await saveLogPhotos(req.db, req.params.logId, photoUrls);
    const data = await getAllLogs(req.db, pid);
    res.status(201).json({ message: 'Photos uploaded successfully', photoUrls, ...data });
  } catch (err) {
    console.error('uploadPhotos error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
