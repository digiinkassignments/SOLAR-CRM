const router = require('express').Router();
const workspace = require('../services/customerWorkspace');
const wrap = fn => async (req, res) => {
  try { await fn(req, res); } catch (e) {
    if (!e.status) console.error('Customer workspace:', e.message);
    res.status(e.status || 500).json({ success: false, message: e.status ? e.message : 'Could not update the customer workspace. Please retry.' });
  }
};
router.post('/bulk-import', wrap(async (req, res) => {
  const data = await workspace.importCustomers(req.db, req.body, req.user);
  res.json({ success: true, data });
}));
router.get('/:id/payment-plans', wrap(async (req, res) => {
  await workspace.ensure(req.db);
  const customer = await workspace.accessibleCustomer(req.db, req.params.id, req.user);
  const [invoices] = await req.db.query('SELECT id,invoice_number,customer_name,gross_total,net_payable_amount,amount_paid,balance_due FROM invoices WHERE customer_id=? OR (lead_id=? AND ? IS NOT NULL) ORDER BY id DESC', [customer.id, customer.lead_id, customer.lead_id]);
  const [plans] = await req.db.query('SELECT invoice_id,version FROM customer_payment_plans WHERE customer_id=?', [customer.id]);
  const [milestones] = await req.db.query("SELECT id,invoice_id,title,amount,DATE_FORMAT(due_date,'%Y-%m-%d') AS due_date,position FROM customer_payment_milestones WHERE customer_id=? ORDER BY invoice_id,position,id", [customer.id]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  res.json({ success: true, data: invoices.map(invoice => ({ ...invoice, version: Number(plans.find(p => Number(p.invoice_id) === Number(invoice.id))?.version || 0), milestones: workspace.allocateMilestones(milestones.filter(m => Number(m.invoice_id) === Number(invoice.id)), invoice.amount_paid, today) })) });
}));
router.put('/:id/payment-plans/:invoiceId', wrap(async (req, res) => {
  const data = await workspace.savePlan(req.db, req.params.id, req.params.invoiceId, req.body, req.user);
  res.json({ success: true, data, message: 'Payment milestone plan saved.' });
}));
module.exports = router;
