const {
  ensureInstallationLogsTable,
  getAllLogs,
  createLog,
  updateLog,
  saveLogPhotos
} = require('../models/installationLogModel');

exports.getLogs = async (req, res) => {
  try {
    await ensureInstallationLogsTable(req.db);
    const data = await getAllLogs(req.db, req.params.id);
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
    const id = await createLog(req.db, req.params.id, req.body, req.user?.id || req.user?.userId);
    const data = await getAllLogs(req.db, req.params.id);
    res.status(201).json({ message: 'Log created', id, ...data });
  } catch (err) {
    console.error('createLog error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLog = async (req, res) => {
  try {
    await ensureInstallationLogsTable(req.db);
    await updateLog(req.db, req.params.logId, req.params.id, req.body);
    const data = await getAllLogs(req.db, req.params.id);
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

    const photoRecords = files.map((f) => ({
      photo_url: `/uploads/installation/${f.filename}`,
      file_name: f.originalname,
      file_size: f.size,
    }));

    await saveLogPhotos(req.db, req.params.logId, photoRecords);
    const data = await getAllLogs(req.db, req.params.id);
    res.status(200).json({
      message: 'Photos uploaded successfully',
      photos: photoRecords,
      ...data
    });
  } catch (err) {
    console.error('uploadPhotos error:', err);
    res.status(500).json({ message: 'Failed to upload photos: ' + err.message });
  }
};
