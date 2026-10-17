const { ensureInspectionTable, getInspectionByProject, createInspection, updateInspection } = require('../models/inspectionModel');

exports.getInspection = async (req, res) => {
  try {
    const db = req.db;
    await ensureInspectionTable(db);
    const data = await getInspectionByProject(db, req.params.id);
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
    const existing = await getInspectionByProject(db, req.params.id);
    if (existing) return res.status(400).json({ message: 'Inspection already exists. Use PUT to update.' });
    const id = await createInspection(db, req.params.id, req.body, req.user?.id || req.user?.userId);
    const data = await getInspectionByProject(db, req.params.id);
    res.status(201).json({ message: 'Inspection created', inspection: data });
  } catch (err) {
    console.error('createInspection error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateInspection = async (req, res) => {
  try {
    const db = req.db;
    await updateInspection(db, req.params.id, req.body);
    const data = await getInspectionByProject(db, req.params.id);
    res.json({ message: 'Inspection updated', inspection: data });
  } catch (err) {
    console.error('updateInspection error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
