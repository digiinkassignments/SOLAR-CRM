const collections = require('./customerCollections');
const { days, date } = require('./customerInvoiceLedger');
function reminders(row, today, refundDays) {
  const tasks = [];
  for (const invoice of row.ledger.invoices) {
    if (invoice.balance_due <= invoice.loan_awaited) continue;
    const dueDates = [
      ...new Set(
        [invoice.next_due_date, ...invoice.milestones.map((m) => m.due_date)].filter(Boolean)
      ),
    ];
    for (const due of dueDates) {
      const age = days(due, today);
      if (age === -3 || age === 0 || (age > 0 && age % 7 === 0))
        tasks.push({
          key: `invoice:${invoice.key}:${due}:${today}`,
          title: age > 0 ? 'Customer payment overdue' : 'Customer payment due',
          body: `${invoice.invoice_number}: ₹${invoice.balance_due.toLocaleString('en-IN')} outstanding; due ${due}.`,
        });
    }
  }
  if (
    row.promised_date &&
    row.promised_date <= today &&
    !row.task_done &&
    (row.ledger.balance_due || row.ledger.refund_due)
  )
    tasks.push({
      key: `promise:${row.promised_date}:${today}`,
      title: 'Customer promised-date follow-up',
      body: `Promised date ${row.promised_date}. ${row.last_note || ''}`,
    });
  const refundSince = row.ledger.invoices
    .filter((i) => i.refund_due > 0)
    .map((i) => i.refund_due_since)
    .filter(Boolean)
    .sort()[0];
  if (row.ledger.refund_due > 0 && refundSince && days(refundSince, today) >= refundDays)
    tasks.push({
      key: `refund:${refundSince}:week-${Math.floor((days(refundSince, today) - refundDays) / 7)}`,
      title: 'Customer refund pending',
      body: `₹${row.ledger.refund_due.toLocaleString('en-IN')} refundable to the customer. Please arrange the refund.`,
    });
  return tasks;
}
async function processTenant(db, now = new Date()) {
  const workflow = require('./salesWorkflow'),
    prefs = await workflow.preferences(db);
  const clock = workflow.localClock(prefs.timezone, now);
  if (clock.time < '08:00') return;
  const rows = await collections.all(db, { role_id: 1, id: 0 });
  const [[settings]] = await db.query(
    'SELECT refund_alert_days FROM customer_collection_settings WHERE id=1'
  );
  const [admins] = await db.query(
    "SELECT id FROM users WHERE role_id=1 AND is_deleted=0 AND LOWER(status)='active' ORDER BY id LIMIT 1"
  );
  const [active] = await db.query(
    "SELECT id FROM users WHERE is_deleted=0 AND LOWER(status)='active'"
  );
  const activeIds = new Set(active.map((u) => Number(u.id)));
  for (const row of rows) {
    const owner = activeIds.has(Number(row.collection_owner_id))
      ? row.collection_owner_id
      : admins[0]?.id;
    if (!owner) continue;
    for (const task of reminders(row, clock.date, Number(settings.refund_alert_days))) {
      await deliver(db, row.id, owner, task);
    }
  }
}
async function deliver(db, customerId, owner, task) {
  const c = await db.getConnection();
  let body;
  try {
    await c.beginTransaction();
    const [[customer]] = await c.query(
      'SELECT customer_name,customer_code FROM customers WHERE id=? FOR UPDATE',
      [customerId]
    );
    if (!customer) {
      await c.rollback();
      return;
    }
    body = `${customer.customer_name} (${customer.customer_code}): ${task.body}`;
    await c.query(
      "INSERT INTO crm_reminder_deliveries(dedupe_key,user_id,kind,status) VALUES(?,?,?,'stored')",
      [`collection:${customerId}:${owner}:${task.key}`, owner, 'customer_collection_due']
    );
    await c.query(
      'INSERT INTO notifications(user_id,title,body,type,reference_id) VALUES(?,?,?,?,?)',
      [owner, task.title, body, 'customer_collection_due', customerId]
    );
    await c.commit();
  } catch (e) {
    await c.rollback();
    if (e.code === 'ER_DUP_ENTRY') return;
    throw e;
  } finally {
    c.release();
  }
  await require('./notificationService').pushToUser(
    owner,
    { title: task.title, body, type: 'customer_collection_due', referenceId: customerId },
    db
  );
}
module.exports = { reminders, processTenant };
