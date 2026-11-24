const test = require('node:test');
const assert = require('node:assert/strict');
const ledger = require('../services/customerLedger');

test('balance and refund follow the agreed formulas and cannot both be positive', () => {
  for (const contract of [0, 100, 200000]) {
    for (const receipts of [0, 50, 150000, 220000]) {
      for (const loans of [0, 70000]) {
        for (const refunds of [0, 5000, 20000]) {
          const result = ledger.summary(contract, receipts, loans, refunds);
          assert.equal(result.total_received, receipts + loans);
          assert.equal(result.balance_due, Math.max(0, contract - receipts - loans));
          assert.equal(result.refund_due, Math.max(0, receipts + loans - contract - refunds));
          assert.equal(result.balance_due > 0 && result.refund_due > 0, false);
        }
      }
    }
  }
});
test('loan receipts produce refundable excess, sanctioned amount and subsidy do not enter balance', () => {
  assert.deepEqual(ledger.summary(200000, 150000, 70000, 0), {
    contract_total: 200000,
    total_received: 220000,
    loan_disbursed: 70000,
    refunds_paid: 0,
    balance: -20000,
    balance_due: 0,
    refund_due: 20000,
  });
  assert.equal(ledger.summary(200000, 150000, 70000, 20000).balance, 0);
  assert.equal(ledger.summary(200000, 150000, 70000, 5000).refund_due, 15000);
  assert.equal(ledger.summary(0, 0, 0, 0).balance, 0);
});
test('import overpayment warns, refund due is derived, excess refund is invalid', () => {
  const row = {
    invoice_amount: '200000',
    payment_amount: '150000',
    loan_sanctioned_amount: '100000',
    loan_disbursed_amount: '70000',
  };
  assert.equal(ledger.importFinancials(row).refundDue, 20000);
  assert(ledger.importFinancials(row).warning);
  assert.match(
    ledger.importFinancials({ ...row, refund_paid_amount: '20000.01' }).error,
    /exceeds/
  );
  const paid = {
    ...row,
    refund_paid_amount: '20000',
    refund_date: '2026-11-20',
    refund_mode: 'UPI',
    refund_reference: 'R1',
  };
  assert.equal(ledger.importFinancials(paid).refundDue, 0);
  for (const update of [
    { refund_date: '2026-02-30' },
    { refund_mode: 'wrong' },
    { refund_paid_amount: '-1' },
    { loan_disbursed_amount: '0.001' },
  ])
    assert(ledger.importFinancials({ ...paid, ...update }).error);
});
test('all six customer import headers map correctly', async () => {
  const { normalizeImportRow } =
    await import('../../solar_crm_frontend/src/pages/Customers/customerImport.js');
  const result = normalizeImportRow({
    'Loan Sanctioned Amount': 1,
    'Loan Disbursed Amount': 2,
    'Refund Paid Amount': 3,
    'Refund Date': '2026-11-20',
    'Refund Mode': 'UPI',
    'Refund Reference': 'R1',
  });
  assert.deepEqual(result, {
    loan_sanctioned_amount: '1',
    loan_disbursed_amount: '2',
    refund_paid_amount: '3',
    refund_date: '2026-11-20',
    refund_mode: 'UPI',
    refund_reference: 'R1',
  });
});
test('recycle snapshot is authenticated encryption and audit count object contains no PII', () => {
  process.env.CUSTOMER_RECYCLE_KEY = 'test-only-key';
  const deletion = require('../services/customerDeletion');
  const original = { customer_name: 'Private test', phone: '9999999999', reason: 'Private reason' };
  const buffer = deletion.seal(original);
  assert(!buffer.includes(Buffer.from(original.customer_name)));
  assert.deepEqual(deletion.open(buffer), original);
  buffer[buffer.length - 1] ^= 1;
  assert.throws(() => deletion.open(buffer));
  const counts = deletion.counts({
    rows: { customers: [original], invoices: [{}], leads: [{}] },
    files: [],
    detached: { stock_transactions: [{}] },
  });
  assert.equal(counts.invoices, 1);
  assert.equal(counts.stock_transactions, 1);
  assert(!JSON.stringify(counts).includes('Private'));
  assert.throws(() => deletion.ident('customers; DROP TABLE users'));
});
test('export uses valid ZIP signatures and protects CSV formula prefixes', () => {
  const exporter = require('../services/customerExport');
  const csv = exporter.csv({ rows: { customers: [{ id: 1, customer_name: '=DANGEROUS' }] } });
  assert(csv.includes('=DANGEROUS'));
  const zip = exporter.zip([{ name: 'records.csv', data: csv }]);
  assert.equal(zip.readUInt32LE(0), 0x04034b50);
  assert.equal(zip.readUInt32LE(zip.length - 22), 0x06054b50);
});
