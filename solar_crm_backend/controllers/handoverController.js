const { ensureHandoverTable, getHandover, createHandover, updateHandover } = require('../models/handoverModel');

exports.get = async (req, res) => {
  try {
    await ensureHandoverTable(req.db);
    const data = await getHandover(req.db, req.params.id);
    res.json({ handover: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    await ensureHandoverTable(req.db);
    const existing = await getHandover(req.db, req.params.id);
    if (existing) return res.status(400).json({ message: 'Already exists. Use PUT.' });
    await createHandover(req.db, req.params.id, req.body, req.user?.id || req.user?.userId);
    const data = await getHandover(req.db, req.params.id);
    res.status(201).json({ message: 'Handover created', handover: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.update = async (req, res) => {
  try {
    await updateHandover(req.db, req.params.id, req.body);
    const data = await getHandover(req.db, req.params.id);
    res.json({ message: 'Updated', handover: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};
