const {
  ensureWarrantyTable,
  getWarrantyAndVisits,
  createWarranty,
  updateWarranty,
  addServiceVisit
} = require('../models/warrantyModel');

exports.get = async (req, res) => {
  try {
    await ensureWarrantyTable(req.db);
    const data = await getWarrantyAndVisits(req.db, req.params.id);
    res.json({
      warranty: data.warranty,
      visits: data.visits
    });
  } catch (err) {
    console.error('Warranty get error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createOrUpdate = async (req, res) => {
  try {
    await ensureWarrantyTable(req.db);
    const existing = await getWarrantyAndVisits(req.db, req.params.id);
    if (existing.warranty) {
      await updateWarranty(req.db, req.params.id, req.body);
    } else {
      await createWarranty(req.db, req.params.id, req.body, req.user?.id || req.user?.userId);
    }
    const data = await getWarrantyAndVisits(req.db, req.params.id);
    res.status(200).json({
      message: 'Warranty & AMC saved successfully',
      warranty: data.warranty,
      visits: data.visits
    });
  } catch (err) {
    console.error('Warranty save error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addVisit = async (req, res) => {
  try {
    await ensureWarrantyTable(req.db);
    await addServiceVisit(req.db, req.params.id, req.body, req.user?.id || req.user?.userId);
    const data = await getWarrantyAndVisits(req.db, req.params.id);
    res.status(201).json({
      message: 'Service visit logged successfully',
      warranty: data.warranty,
      visits: data.visits
    });
  } catch (err) {
    console.error('Add visit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
