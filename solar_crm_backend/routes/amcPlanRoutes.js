const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const plans = require('../services/amcPlans');
router.use(verifyToken, (req, res, next) => {
  if (![1, 2].includes(Number(req.user?.role_id))) return res.sendStatus(403);
  if (req.clientInfo?.id && req.user?.client_id && Number(req.user.client_id) !== Number(req.clientInfo.id)) return res.status(403).json({ message: 'Sign in to this company again.' });
  if (req.method !== 'GET' && Number(req.user.role_id) !== 1) return res.status(403).json({ message: 'Only the company administrator can edit AMC plans.' });
  next();
});
const run = fn => async (req, res) => { try { await plans.ensure(req.db); await fn(req, res); } catch (error) { if (!error.status) console.error('AMC plans:', error.code || error.message); res.status(error.status || 500).json({ message: error.status ? error.message : 'Could not save AMC plans. Try again.' }); } };
router.get('/', run(async (req, res) => {
  const [rows] = await req.db.query('SELECT * FROM company_amc_plans ORDER BY is_active DESC,name,id');
  res.json({ plans: rows });
}));
router.post('/', run(async (req, res) => {
  const p = plans.validate(req.body);
  const [result] = await req.db.query('INSERT INTO company_amc_plans (name,coverage,exclusions,annual_amount,visit_frequency,term_months,is_active,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?)', [p.name,p.coverage,p.exclusions,p.annual_amount,p.visit_frequency,p.term_months,p.is_active,req.user.id,req.user.id]);
  res.status(201).json({ id: result.insertId });
}));
router.put('/:id', run(async (req, res) => {
  const p = plans.validate(req.body), id = Number(req.params.id), version = Number(req.body.version);
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(version) || version < 1) return res.status(400).json({ message: 'Invalid plan or version.' });
  const [result] = await req.db.query('UPDATE company_amc_plans SET name=?,coverage=?,exclusions=?,annual_amount=?,visit_frequency=?,term_months=?,is_active=?,updated_by=?,version=version+1 WHERE id=? AND version=?', [p.name,p.coverage,p.exclusions,p.annual_amount,p.visit_frequency,p.term_months,p.is_active,req.user.id,id,version]);
  if (!result.affectedRows) return res.status(409).json({ message: 'This plan changed. Reload before editing again.' });
  res.json({ id, version: version + 1 });
}));
module.exports = router;
