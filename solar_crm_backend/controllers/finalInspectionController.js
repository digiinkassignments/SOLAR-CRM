const { ensureFinalInspectionTable, getFinalInspection, createFinalInspection, updateFinalInspection } = require('../models/finalInspectionModel');

exports.get = async (req, res) => {
  try {
    await ensureFinalInspectionTable(req.db);
    const data = await getFinalInspection(req.db, req.params.id);
    res.json({ finalInspection: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    await ensureFinalInspectionTable(req.db);
    const existing = await getFinalInspection(req.db, req.params.id);
    if (existing) return res.status(400).json({ message: 'Already exists. Use PUT.' });
    await createFinalInspection(req.db, req.params.id, req.body, req.user?.id || req.user?.userId);
    const data = await getFinalInspection(req.db, req.params.id);
    res.status(201).json({ message: 'Final inspection created', finalInspection: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.update = async (req, res) => {
  try {
    await updateFinalInspection(req.db, req.params.id, req.body);
    const data = await getFinalInspection(req.db, req.params.id);
    res.json({ message: 'Updated', finalInspection: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};
