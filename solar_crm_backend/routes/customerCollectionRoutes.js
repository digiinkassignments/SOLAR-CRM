const router = require('express').Router();
const service = require('../services/customerCollections');
const workspace = require('../services/customerWorkspace');
const wrap = (fn) => async (req, res) => {
  try {
    service.authorize(req.user);
    await fn(req, res);
  } catch (e) {
    if (!e.status) console.error('Customer collections:', e.code || e.message);
    res.status(e.status || 500).json({
      success: false,
      message: e.status ? e.message : 'Customer collections could not be loaded. Please retry.',
    });
  }
};
router.get(
  '/directory',
  wrap(async (req, res) => {
    const data = await service.list(req.db, req.user, req.query);
    if (req.query.export === 'csv')
      return res
        .type('text/csv')
        .attachment('customer-collections.csv')
        .send(service.csv(data.rows));
    res.json({ success: true, data });
  })
);
router.put(
  '/directory/settings',
  wrap(async (req, res) => {
    if (!service.finance(req.user)) return res.sendStatus(403);
    const days = Number(req.body.refund_alert_days);
    if (!Number.isInteger(days) || days < 1 || days > 365)
      return res.status(400).json({ success: false, message: 'Choose 1–365 days.' });
    await require('../services/customerLedger').ensure(req.db);
    await require('../services/customerCollectionSchema').ensure(req.db);
    await req.db.query('UPDATE customer_collection_settings SET refund_alert_days=? WHERE id=1', [
      days,
    ]);
    res.json({ success: true });
  })
);
router.post(
  '/directory/bulk',
  wrap(async (req, res) => {
    if (!Array.isArray(req.body.ids))
      return res.status(400).json({ success: false, message: 'Select customer IDs.' });
    const ids = [...new Set(req.body.ids || [])];
    if (
      !Array.isArray(req.body.ids) ||
      !ids.length ||
      ids.length > 100 ||
      ids.some((id) => !Number.isSafeInteger(Number(id)) || Number(id) < 1)
    )
      return res.status(400).json({ success: false, message: 'Select 1–100 customers.' });
    // Validate every selected customer before doing any writes or returning PII.
    for (const id of ids) await workspace.accessibleCustomer(req.db, id, req.user);
    const rows = (await service.all(req.db, req.user)).filter((r) =>
      ids.some((id) => Number(id) === Number(r.id))
    );
    if (rows.length !== ids.length) return res.sendStatus(404);
    if (req.body.action === 'export')
      return res
        .type('text/csv')
        .attachment('selected-customer-collections.csv')
        .send(service.csv(rows));
    if (req.body.action === 'reminder')
      return res.json({
        success: true,
        data: rows.map((r) => ({
          id: r.id,
          customer_name: r.customer_name,
          url: `https://wa.me/${String(r.mobile_number)
            .replace(/\D/g, '')
            .replace(
              /^(\d{10})$/,
              '91$1'
            )}?text=${encodeURIComponent(`Hello ${r.customer_name}, ${r.ledger.refund_due ? `your refund of ₹${r.ledger.refund_due.toLocaleString('en-IN')} is pending. We will update you on its payment.` : `this is a reminder for your outstanding payment of ₹${r.ledger.balance_due.toLocaleString('en-IN')}. Please share your payment update.`}`)}`,
        })),
      });
    if (req.body.action !== 'assign' || Number(req.user.role_id) === 3) return res.sendStatus(403);
    for (const id of ids)
      await service.followup(
        req.db,
        id,
        { action: 'assign', owner_id: req.body.owner_id },
        req.user
      );
    res.json({ success: true });
  })
);
router.get(
  '/:id/collections',
  wrap(async (req, res) =>
    res.json({ success: true, data: await service.detail(req.db, req.params.id, req.user) })
  )
);
router.post(
  '/:id/collections',
  wrap(async (req, res) => {
    await service.followup(req.db, req.params.id, req.body, req.user);
    res.json({ success: true });
  })
);
router.post(
  '/:id/collection-payment',
  wrap(async (req, res) =>
    res.json({
      success: true,
      data: await service.payment(req.db, req.params.id, req.body, req.user),
    })
  )
);
router.put(
  '/:id/collection-due-date',
  wrap(async (req, res) => {
    if (![1, 2].includes(Number(req.user.role_id)) && !service.finance(req.user))
      return res.sendStatus(403);
    if (!workspace.validDate(req.body.due_date))
      return res.status(400).json({ success: false, message: 'Enter a valid due date.' });
    const customer = await workspace.accessibleCustomer(req.db, req.params.id, req.user);
    const data = await service.detail(req.db, customer.id, req.user);
    const row = data.ledger.invoices.find((r) => r.key === req.body.record_key);
    if (!row || row.key === 'unallocated') return res.sendStatus(404);
    const c = await req.db.getConnection();
    try {
      await c.beginTransaction();
      await c.query('SELECT id FROM customers WHERE id=? FOR UPDATE', [customer.id]);
      if (row.invoice_id) {
        await workspace.invoiceForCustomer(c, customer, row.invoice_id, true);
        await c.query('UPDATE invoices SET due_date=? WHERE id=?', [
          req.body.due_date,
          row.invoice_id,
        ]);
        if (row.milestones.length)
          await c.query(
            'UPDATE customer_payment_milestones SET due_date=? WHERE customer_id=? AND id IN (?)',
            [req.body.due_date, customer.id, row.milestones.map((m) => m.id)]
          );
        await c.query('UPDATE customer_payment_plans SET version=version+1 WHERE invoice_id=?', [
          row.invoice_id,
        ]);
      } else
        await c.query('UPDATE customer_opening_records SET due_date=? WHERE customer_id=?', [
          req.body.due_date,
          customer.id,
        ]);
      await c.query(
        "INSERT INTO customer_collection_activity(customer_id,action,note,performed_by) VALUES(?,'Due date',?,?)",
        [customer.id, `${row.invoice_number}: ${req.body.due_date}`, req.user.id]
      );
      await c.commit();
      res.json({ success: true });
    } catch (e) {
      await c.rollback();
      throw e;
    } finally {
      c.release();
    }
  })
);
router.post(
  '/:id/credit-notes',
  wrap(async (req, res) => {
    if (!service.finance(req.user)) return res.sendStatus(403);
    const customer = await workspace.accessibleCustomer(req.db, req.params.id, req.user);
    await service.detail(req.db, customer.id, req.user);
    const b = req.body,
      amount = workspace.cents(b.amount);
    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !workspace.validDate(b.credit_date) ||
      !String(b.reference || '').trim() ||
      String(b.reference).length > 100 ||
      !/^[\w-]{16,80}$/.test(b.request_key || '')
    )
      return res
        .status(400)
        .json({ success: false, message: 'Enter amount, credit date, reference and request ID.' });
    const c = await req.db.getConnection();
    try {
      await c.beginTransaction();
      await c.query('SELECT id FROM customers WHERE id=? FOR UPDATE', [customer.id]);
      const invoice = await workspace.invoiceForCustomer(c, customer, b.invoice_id, true);
      const [[old]] = await c.query('SELECT * FROM customer_credit_notes WHERE request_key=?', [
        b.request_key,
      ]);
      if (old) {
        if (
          Number(old.customer_id) !== Number(customer.id) ||
          Number(old.invoice_id) !== Number(invoice.id) ||
          Number(old.recorded_by) !== Number(req.user.id) ||
          Math.round(Number(old.amount) * 100) !== amount ||
          old.reference !== b.reference
        )
          throw Object.assign(new Error('Request ID already used.'), { status: 409 });
      } else {
        const [[credits]] = await c.query(
          'SELECT COALESCE(SUM(amount),0) AS amount FROM customer_credit_notes WHERE invoice_id=?',
          [invoice.id]
        );
        if (
          amount + Math.round(Number(credits.amount) * 100) >
          Math.round(Number(invoice.gross_total) * 100)
        )
          throw Object.assign(new Error('Credit notes cannot exceed the invoice amount.'), {
            status: 400,
          });
        await c.query(
          'INSERT INTO customer_credit_notes(customer_id,invoice_id,amount,credit_date,reference,recorded_by,request_key) VALUES(?,?,?,?,?,?,?)',
          [
            customer.id,
            invoice.id,
            amount / 100,
            b.credit_date,
            b.reference,
            req.user.id,
            b.request_key,
          ]
        );
      }
      await c.commit();
      res.json({ success: true });
    } catch (e) {
      await c.rollback();
      throw e;
    } finally {
      c.release();
    }
  })
);
module.exports = router;
