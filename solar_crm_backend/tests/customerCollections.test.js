const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../services/customerInvoiceLedger');
const { match, totals, csv, finance } = require('../services/customerCollections');
const { reminders } = require('../services/customerCollectionReminders');
const schedule = require('../services/quotationPaymentSchedule');
const today = '2026-11-24';
const invoice = (id, amount, paid, extra = {}) => ({
  id,
  gross_total: amount,
  amount_paid: paid,
  invoice_number: `INV-${id}`,
  invoice_date: '2026-11-01',
  due_date: '2026-11-20',
  ...extra,
});
const customer = (ledger, extra = {}) => ({
  id: 1,
  ledger,
  project_stages: [],
  followup_status: 'Not contacted',
  ...extra,
});
test('separate invoices retain both outstanding and refund without netting', () => {
  const l = calculate(
    [invoice(1, 100000, 50000), invoice(2, 100000, 130000)],
    null,
    [],
    [],
    [],
    [],
    today
  );
  assert.equal(l.balance_due, 50000);
  assert.equal(l.refund_due, 30000);
  assert.equal(l.total_received, 180000);
  assert.equal(l.invoices[0].refund_due, 0);
  assert.equal(l.invoices[1].balance_due, 0);
});
test('opening formula remains shared with manual/import; credits reduce final before receipts', () => {
  const l = calculate(
    [invoice(1, 100, 100)],
    {
      invoice_amount: 300000,
      amount_paid: 260000,
      loan_disbursed_amount: 50000,
      refund_paid_amount: 4000,
    },
    [],
    [],
    [{ invoice_id: 1, amount: 20 }],
    [],
    today
  );
  assert.equal(l.refund_due, 6020);
  assert.equal(l.balance_due, 0);
  assert.equal(l.contract_total, 300080);
});
test('loan allocation is once per linked debt and undisbursed sanction is not received', () => {
  const l = calculate(
    [invoice(1, 100, 0, { lead_id: 3 }), invoice(2, 100, 0, { lead_id: 3 })],
    null,
    [{ lead_id: 3, disbursed_amount: 120, sanctioned_amount: 180 }],
    [],
    [],
    [],
    today
  );
  assert.equal(l.total_received, 120);
  assert.equal(l.balance_due, 80);
  assert.equal(l.loan_awaited, 60);
  assert.equal(l.invoices[0].loan_disbursed, 100);
  assert.equal(l.invoices[1].loan_disbursed, 20);
  assert.equal(l.loan_sanctioned, 180);
});
test('invoice-specific and legacy refunds reduce only excess, never receivables', () => {
  const l = calculate(
    [invoice(1, 100, 150), invoice(2, 100, 30)],
    null,
    [],
    [{ record_key: 'invoice-1', amount: 20 }],
    [],
    [],
    today
  );
  assert.equal(l.refund_due, 30);
  assert.equal(l.balance_due, 70);
});
test('milestone dates skip covered milestones and retain unscheduled balance bucket', () => {
  const l = calculate(
    [invoice(1, 100, 40, { due_date: null })],
    null,
    [],
    [],
    [],
    [
      { id: 1, invoice_id: 1, position: 1, amount: 40, due_date: '2026-11-01' },
      { id: 2, invoice_id: 1, position: 2, amount: 30, due_date: '2026-12-01' },
    ],
    today
  );
  assert.equal(l.next_due_date, '2026-12-01');
  assert.equal(l.no_due_date, true);
  assert.equal(l.days_overdue, 0);
});
test('filters combine; due windows exclude past dates and loan-awaited chase excludes fully covered debt', () => {
  const l = calculate(
    [invoice(1, 100, 0, { lead_id: 3 })],
    null,
    [{ lead_id: 3, sanctioned_amount: 100, disbursed_amount: 0 }],
    [],
    [],
    [],
    today
  );
  const r = customer(l);
  assert.equal(match(r, { balance: 'outstanding', due: 'overdue' }, today), false);
  assert.equal(match(r, { balance: 'outstanding', loan: 'awaited' }, today), true);
  assert.equal(match(r, { due: '15' }, today), false);
  assert.equal(match(r, { due: 'custom', from: '2026-11-19', to: '2026-11-21' }, today), true);
  assert.equal(match(r, { balance: 'refund', loan: 'awaited' }, today), false);
});
test('totals add per-customer refunds, never offset debts, and CSV is formula-safe', () => {
  const rows = [
    customer(calculate([invoice(1, 100, 130)], null, [], [], [], [], today), {
      customer_name: '=HYPERLINK("x")',
    }),
    customer(calculate([invoice(2, 200, 100)], null, [], [], [], [], today)),
  ];
  assert.equal(totals(rows).outstanding, 100);
  assert.equal(totals(rows).refund_due, 30);
  assert.match(csv(rows), /"'=HYPERLINK/);
});
test('only Admin and Finance may record amounts', () => {
  assert.equal(finance({ role_id: 1 }), true);
  assert.equal(finance({ role_id: 2 }), false);
  assert.equal(finance({ role_id: 3 }), false);
  assert.equal(finance({ role_id: 8, portal_role: 'finance' }), true);
});
test('reminder cadence uses dated debt, promised tasks and configurable refund age', () => {
  let row = customer(
    calculate([invoice(1, 100, 0, { due_date: '2026-11-27' })], null, [], [], [], [], today)
  );
  assert.equal(reminders(row, today, 7).length, 1);
  row = customer(
    calculate([invoice(1, 100, 130, { payment_date: '2026-11-17' })], null, [], [], [], [], today)
  );
  assert.equal(reminders(row, today, 7)[0].title, 'Customer refund pending');
  assert.equal(reminders(row, today, 8).length, 0);
  row.promised_date = today;
  assert.equal(reminders(row, today, 8)[0].title, 'Customer promised-date follow-up');
});
test('dated quotation schedule validates 100% and paise rounding preserves invoice total', () => {
  const rows = schedule.validate([
    { title: 'Advance', percent: 33.33, due_date: '2026-11-24' },
    { title: 'Dispatch', percent: 66.67, due_date: '2026-12-01' },
  ]);
  assert.equal(
    schedule.amounts(rows, 100.01).reduce((s, r) => s + Math.round(r.amount * 100), 0),
    10001
  );
  assert.throws(() =>
    schedule.validate([{ title: 'Advance', percent: 20, due_date: '2026-11-24' }])
  );
  assert.throws(() =>
    schedule.validate([{ title: 'Advance', percent: 100, due_date: '2026-02-31' }])
  );
});
