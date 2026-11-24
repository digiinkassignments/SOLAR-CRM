const { warrantySelection } = require('../services/amcPlans');
const {
  ensureWarrantyTable,
  getWarrantyAndVisits,
  createWarranty,
  updateWarranty,
  addServiceVisit,
  updateServiceVisit
} = require('../models/warrantyModel');

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
    await ensureWarrantyTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const data = await getWarrantyAndVisits(req.db, pid);
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
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    const existing = await getWarrantyAndVisits(req.db, pid);
    const payload = await warrantySelection(req.db, req.body, existing.warranty);
    const [[handover]] = await req.db.query(`SELECT handover_date,handover_status FROM project_handover
      WHERE project_id=? AND is_deleted=0 LIMIT 1`, [pid]);
    if (handover?.handover_status !== 'Completed' || !handover.handover_date)
      throw Object.assign(new Error('Complete customer handover before activating warranty.'), { status: 422 });
    payload.warranty_start_date = require('../services/subsidyRules').dateOnly(handover.handover_date);
    if (existing.warranty) {
      await updateWarranty(req.db, pid, payload);
    } else {
      await createWarranty(req.db, pid, payload, req.user?.id || req.user?.userId);
    }
    const data = await getWarrantyAndVisits(req.db, pid);
    res.status(200).json({
      message: 'Warranty & AMC saved successfully',
      warranty: data.warranty,
      visits: data.visits
    });
  } catch (err) {
    if (!err.status) console.error('Warranty save error:', err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
  }
};

exports.addVisit = async (req, res) => {
  try {
    await ensureWarrantyTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    await addServiceVisit(req.db, pid, req.body, req.user?.id || req.user?.userId);
    const data = await getWarrantyAndVisits(req.db, pid);
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

exports.updateVisit = async (req, res) => {
  try {
    await ensureWarrantyTable(req.db);
    const pid = await resolveNumericProjectId(req.db, req.params.id);
    await updateServiceVisit(req.db, req.params.visitId, req.body);
    const data = await getWarrantyAndVisits(req.db, pid);
    res.status(200).json({
      message: 'Service visit updated',
      warranty: data.warranty,
      visits: data.visits
    });
  } catch (err) {
    console.error('Update visit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
