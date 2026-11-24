const test = require('node:test'),
  assert = require('node:assert/strict');
const w = require('../services/customerWorkspace');
test('customer imports accept optional capacity and exact opening financial amounts', () => {
  for (const row of [
    { invoice_amount: '100', payment_amount: '101' },
    { payment_amount: '1' },
    {},
    { plant_size_kw: '5.45', invoice_amount: '250000', payment_amount: '50000' },
    { plant_size_kw: '0.125', invoice_amount: '100.01', payment_amount: '100.01' },
  ])
    assert.equal(w.validateImportFinancials(row), null);
  for (const row of [
    { plant_size_kw: '0' },
    { plant_size_kw: '-5' },
    { plant_size_kw: '5 kW' },
    { plant_size_kw: '1.2345' },
    { invoice_amount: '-1' },
    { invoice_amount: '1.005' },
  ])
    assert(w.validateImportFinancials(row), JSON.stringify(row));
});
test('client spreadsheet headers including Payment recieved map without dropping amounts', async () => {
  const { normalizeImportRow, importColumns } =
    await import('../../solar_crm_frontend/src/pages/Customers/customerImport.js');
  assert(importColumns.includes('Plant size'));
  for (const header of ['Payment recieved', 'Payment received', 'payment_amount']) {
    const row = normalizeImportRow({
      customer_name: 'Example',
      mobile_number: 9876543210,
      'Plant size': 5.45,
      'Final amount': 250000,
      [header]: 50000,
    });
    assert.equal(row.plant_size_kw, '5.45');
    assert.equal(row.invoice_amount, '250000');
    assert.equal(row.payment_amount, '50000');
    assert.equal(w.validateImport(row), null);
  }
  assert.throws(
    () => normalizeImportRow({ 'Payment received': 10, 'Payment recieved': 20 }),
    /Duplicate/
  );
  assert.equal(
    w.validateImport(normalizeImportRow({ customer_name: 'Legacy', mobile_number: '9876543210' })),
    null
  );
});
