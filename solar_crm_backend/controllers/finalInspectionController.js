const { ensureFinalInspectionTable, getFinalInspection, createFinalInspection, updateFinalInspection } = require('../models/finalInspectionModel');

exports.get = async (req, res) => {
  try {
    await ensureFinalInspectionTable(req.db);
    const data = await getFinalInspection(req.db, req.params.id);
    res.json({ finalInspection: data, inspection: data, data: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    await ensureFinalInspectionTable(req.db);
    const existing = await getFinalInspection(req.db, req.params.id);
    if (existing) {
      await updateFinalInspection(req.db, req.params.id, req.body);
    } else {
      await createFinalInspection(req.db, req.params.id, req.body, req.user?.id || req.user?.userId);
    }
    const data = await getFinalInspection(req.db, req.params.id);
    res.status(201).json({ message: 'Final inspection saved', finalInspection: data, inspection: data, data: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.update = async (req, res) => {
  try {
    await ensureFinalInspectionTable(req.db);
    const existing = await getFinalInspection(req.db, req.params.id);
    if (existing) {
      await updateFinalInspection(req.db, req.params.id, req.body);
    } else {
      await createFinalInspection(req.db, req.params.id, req.body, req.user?.id || req.user?.userId);
    }
    const data = await getFinalInspection(req.db, req.params.id);
    res.json({ message: 'Updated', finalInspection: data, inspection: data, data: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};
