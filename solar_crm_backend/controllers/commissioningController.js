const { ensureCommissioningTable, getCommissioning, createCommissioning, updateCommissioning } = require('../models/commissioningModel');

exports.get = async (req, res) => {
  try {
    await ensureCommissioningTable(req.db);
    const data = await getCommissioning(req.db, req.params.id);
    res.json({ commissioning: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    await ensureCommissioningTable(req.db);
    const existing = await getCommissioning(req.db, req.params.id);
    if (existing) return res.status(400).json({ message: 'Already exists. Use PUT.' });
    await createCommissioning(req.db, req.params.id, req.body, req.user?.id || req.user?.userId);
    const data = await getCommissioning(req.db, req.params.id);
    res.status(201).json({ message: 'Commissioning created', commissioning: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

exports.update = async (req, res) => {
  try {
    await updateCommissioning(req.db, req.params.id, req.body);
    const data = await getCommissioning(req.db, req.params.id);
    res.json({ message: 'Updated', commissioning: data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};
