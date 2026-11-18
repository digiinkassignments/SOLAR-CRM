const test = require('node:test');
const assert = require('node:assert/strict');
const w = require('../services/customerWorkspace');
test('import normalizes Indian mobile formats and validates required fields', () => {
  assert.equal(w.phone('+91 98765-43210'), '9876543210');
  assert.equal(w.phone('not-a-phone'), '');
  assert.equal(w.validateImport({ customer_name: 'Example', mobile_number: '9876543210', lead_source: 'Referral' }), null);
  assert.match(w.validateImport({ customer_name: 'Example', mobile_number: '123' }), /mobile/);
  assert.match(w.validateImport({ customer_name: 'Example', mobile_number: '9876543210', email: 'bad' }), /Email/);
  assert.match(w.validateImport({ customer_name: 'Example', mobile_number: '9876543210', assigned_to: 'invalid' }), /salesperson/);
});
test('customer source SQL preserves legacy updates and keeps placeholders aligned', async () => {
  const fs = require('fs'), vm = require('vm'), path = require('path');
  const module = { exports: {} }, writes = [];
  const db = { query: async (sql, params = []) => {
    assert.equal((sql.match(/\?/g) || []).length, params.length);
    if (sql.startsWith('INSERT INTO customers') || sql.startsWith('UPDATE customers SET')) writes.push({ sql, params });
    return sql.startsWith('INSERT INTO customers') ? [{ insertId: 1 }] : [[]];
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../models/customerModel.js'), 'utf8'), { module, console, Date, Object, require: name => {
    if (name === '../config/db') return { db };
    if (name === '../services/customerWorkspace') return { ensure: async () => {} };
    if (name === '../utils/managerScope') return {};
    throw Error('Unexpected import: ' + name);
  } });
  await module.exports.createCustomer({ customer_name: 'Test', mobile_number: '9000000000', lead_source: 'Referral' }, 1, db);
  await module.exports.updateCustomer(1, { customer_name: 'Test', mobile_number: '9000000000' }, db);
  assert.equal(writes[0].params.at(-1), 'Referral');
  assert.match(writes[1].sql, /lead_source = IF\(\?, \?, lead_source\)/);
  assert.equal(writes[1].params.at(-3), false);
});
test('payment plan rejects over-allocation, fractional paise and impossible dates', () => {
  assert.throws(() => w.validatePlan([{ title: 'Advance', amount: '100.001' }], 200), /decimal/);
  assert.throws(() => w.validatePlan([{ title: 'Advance', amount: 201 }], 200), /exceed/);
  assert.throws(() => w.validatePlan([{ title: 'Advance', amount: 100, due_date: '2026-02-30' }], 200), /invalid due date/);
  assert.equal(w.validatePlan([{ title: 'Advance', amount: '100.10', due_date: '2026-12-10' }], 200)[0].amount, 100.1);
});
test('invoice receipts cover milestones in their explicit order without double counting', () => {
  const rows = w.allocateMilestones([
    { title: 'Advance', amount: 100, due_date: '2026-11-01' },
    { title: 'Delivery', amount: 200, due_date: '2026-11-10' },
    { title: 'Handover', amount: 100, due_date: '2026-12-10' },
  ], 150, '2026-11-18');
  assert.deepEqual(rows.map(r => r.received_amount), [100, 50, 0]);
  assert.deepEqual(rows.map(r => r.status), ['Paid', 'Overdue', 'Pending']);
  assert.equal(rows.reduce((sum, r) => sum + r.received_amount, 0), 150);
});
test('sales customer access uses assignment/creation scope', async () => {
  let captured;
  const db = { query: async (sql, params) => { captured = { sql, params }; return [[]]; } };
  await assert.rejects(() => w.accessibleCustomer(db, 10, { id: 7, role_id: 3 }), /not found/);
  assert.match(captured.sql, /c.assigned_to=\? OR c.created_by=\?/);
  assert.deepEqual(captured.params, [10, 7, 7]);
});
test('manager import and payment edits cannot be invoked by a sales user', async () => {
  await assert.rejects(() => w.importCustomers({}, { rows: [] }, { id: 7, role_id: 3 }), /Admins and Managers/);
  await assert.rejects(() => w.savePlan({}, 1, 1, {}, { id: 7, role_id: 3 }), /Admins and Managers/);
});
