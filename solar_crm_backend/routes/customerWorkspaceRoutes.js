const router = require('express').Router();
const workspace = require('../services/customerWorkspace');
router.use(require('./customerCollectionRoutes'));
const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (!e.status) console.error('Customer workspace:', e.message);
    res.status(e.status || 500).json({
      success: false,
      message: e.status ? e.message : 'Could not update the customer workspace. Please retry.',
    });
  }
};
router.post(
  '/bulk-import',
  wrap(async (req, res) => {
    const data = await workspace.importCustomers(req.db, req.body, req.user);
    res.json({ success: true, data });
  })
);
router.post(
  '/bulk-import/preview',
  wrap(async (req, res) => {
    if (![1, 2].includes(Number(req.user.role_id)) && req.user.portal_role !== 'finance')
      return res.sendStatus(403);
    if (!Array.isArray(req.body.rows) || req.body.rows.length > 100)
      return res.status(400).json({ success: false, message: 'Preview up to 100 rows.' });
    const rows = req.body.rows.map((row, index) => ({
      row: index + 2,
      error: workspace.validateImport(row),
      ...require('../services/customerLedger').importFinancials(row),
    }));
    const checked = await require('../services/duplicateImport').preview(
      req.db,
      req.body.rows,
      req.user
    );
    for (const item of checked.data)
      if (rows[item.row - 1]) rows[item.row - 1].duplicate = Boolean(item.duplicate);
    const due = rows.filter((r) => !r.error && r.refundDue > 0);
    res.json({
      success: true,
      data: {
        rows: rows.map(({ values, ...r }) => r),
        duplicate_count: checked.duplicate_count,
        refund_due_rows: due.length,
        refund_due_total: Math.round(due.reduce((s, r) => s + r.refundDue, 0) * 100) / 100,
      },
    });
  })
);
router.post(
  '/:id/refunds',
  wrap(async (req, res) => {
    const data = await require('../services/customerLedger').recordRefund(
      req.db,
      req.params.id,
      req.body,
      req.user
    );
    res.json({ success: true, data, message: 'Refund recorded. No automatic message sent.' });
  })
);
router.get(
  '/:id/payment-plans',
  wrap(async (req, res) => {
    await workspace.ensure(req.db);
    const customer = await workspace.accessibleCustomer(req.db, req.params.id, req.user);
    const [invoices] = await req.db.query(
      'SELECT id,invoice_number,customer_name,gross_total,net_payable_amount,amount_paid,balance_due FROM invoices WHERE customer_id=? OR (lead_id=? AND ? IS NOT NULL) ORDER BY id DESC',
      [customer.id, customer.lead_id, customer.lead_id]
    );
    const [plans] = await req.db.query(
      'SELECT invoice_id,version FROM customer_payment_plans WHERE customer_id=?',
      [customer.id]
    );
    const [milestones] = await req.db.query(
      "SELECT id,invoice_id,title,amount,DATE_FORMAT(due_date,'%Y-%m-%d') AS due_date,position FROM customer_payment_milestones WHERE customer_id=? ORDER BY invoice_id,position,id",
      [customer.id]
    );
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    res.json({
      success: true,
      data: invoices.map((invoice) => ({
        ...invoice,
        version: Number(
          plans.find((p) => Number(p.invoice_id) === Number(invoice.id))?.version || 0
        ),
        milestones: workspace.allocateMilestones(
          milestones.filter((m) => Number(m.invoice_id) === Number(invoice.id)),
          invoice.amount_paid,
          today
        ),
      })),
    });
  })
);
router.put(
  '/:id/payment-plans/:invoiceId',
  wrap(async (req, res) => {
    const data = await workspace.savePlan(
      req.db,
      req.params.id,
      req.params.invoiceId,
      req.body,
      req.user
    );
    res.json({ success: true, data, message: 'Payment milestone plan saved.' });
  })
);
module.exports = router;
