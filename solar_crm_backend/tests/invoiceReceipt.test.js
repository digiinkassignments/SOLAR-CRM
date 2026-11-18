const test = require('node:test');
const assert = require('node:assert/strict');
const { record } = require('../services/invoiceReceipt');
function fixture({ failUpdate = false } = {}) {
  const state = { paid: 0, receipts: 0, events: [], previous: null };
  const c = {
    beginTransaction: async () => state.events.push('begin'), commit: async () => state.events.push('commit'), rollback: async () => state.events.push('rollback'), release: () => state.events.push('release'),
    query: async (sql, params) => {
      if (sql.startsWith('SELECT * FROM invoices')) return [[{ id: 1, net_payable_amount: 1000, amount_paid: state.paid }]];
      if (sql.startsWith('SELECT * FROM invoice_payment_requests')) return [[...(state.previous ? [state.previous] : [])]];
      if (sql.startsWith('INSERT INTO invoice_payments')) { state.receipts++; return [{ insertId: state.receipts }]; }
      if (sql.startsWith('UPDATE invoices')) { if (failUpdate) throw Error('Update failed'); state.paid = params[0]; }
      if (sql.startsWith('INSERT INTO invoice_payment_requests')) state.previous = { recorded_by: params[2], payload_hash: params[3], result_json: params[4] };
      return [{}];
    },
  };
  return { db: { query: async () => [[]], getConnection: async () => c }, state };
}
const payment = { amount: 100, payment_date: '2026-11-18', request_key: 'payment-test-request-0001' };
test('payment retry returns the first receipt without charging twice', async () => {
  const { db, state } = fixture();
  const first = await record(db, 1, payment, 1), retry = await record(db, 1, payment, 1);
  assert.deepEqual(first, retry); assert.equal(state.receipts, 1); assert.equal(state.paid, 100);
});
test('overpayment is rejected before inserting a receipt', async () => {
  const { db, state } = fixture();
  await assert.rejects(() => record(db, 1, { ...payment, amount: 1001 }, 1), /exceeds/);
  assert.equal(state.receipts, 0); assert.deepEqual(state.events, ['begin', 'rollback', 'release']);
});
test('balance update failure rolls back instead of leaving a partial receipt', async () => {
  const { db, state } = fixture({ failUpdate: true });
  await assert.rejects(() => record(db, 1, payment, 1), /Update failed/);
  assert.deepEqual(state.events, ['begin', 'rollback', 'release']);
});
