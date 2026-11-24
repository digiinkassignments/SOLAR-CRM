const test = require('node:test'),
  assert = require('node:assert/strict'),
  o = require('../services/customerOpening');
const data = () => ({
  customer_name: 'Example',
  invoice_amount: '10000',
  payment_amount: '2500',
  payment_date: '2026-11-18',
  payment_mode: 'UPI',
  payment_reference: 'REF-1',
  request_key: 'request-1234567890123456',
});
test('opening validation accepts overpayment, rejects invalid dates and fractional paise', () => {
  assert.deepEqual(o.validate(data()), { amount: 10000, paid: 2500 });
  assert.equal(o.validate({ ...data(), payment_amount: '10001' }).paid, 10001);
  for (const edit of [
    { invoice_amount: '-1' },
    { payment_amount: '1.234' },
    { payment_date: '2026-02-30' },
    { payment_mode: 'bad' },
    { request_key: '' },
  ])
    assert.throws(() => o.validate({ ...data(), ...edit }));
});
function fixture(fail = false) {
  let old = null,
    inserts = 0,
    rollbacks = 0;
  const db = {
    query: async () => [[]],
    getConnection: async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {
        rollbacks++;
      },
      release: () => {},
      query: async (sql, p) => {
        if (sql.startsWith('SELECT o.')) return [[old].filter(Boolean)];
        if (sql.startsWith('INSERT INTO customer_opening_records')) {
          if (fail) throw Error('Receipt write failed');
          old = {
            customer_id: p[0],
            request_key: p[1],
            payload_hash: p[2],
            recorded_by: p[9],
            customer_code: 'CUST-1',
          };
          return [{ affectedRows: 1 }];
        }
        throw Error(sql);
      },
    }),
  };
  return {
    db,
    insert: async () => {
      inserts++;
      return { id: 1, customer_code: 'CUST-1' };
    },
    count: () => inserts,
    rollbacks: () => rollbacks,
  };
}
test('retry returns same customer without duplicating opening payment', async () => {
  const f = fixture();
  const first = await o.create(f.db, data(), 7, f.insert);
  assert.deepEqual(await o.create(f.db, data(), 7, f.insert), first);
  assert.equal(f.count(), 1);
  await assert.rejects(
    o.create(f.db, { ...data(), payment_amount: '3000' }, 7, f.insert),
    /different/
  );
});
test('receipt insert failure rolls back customer transaction', async () => {
  const f = fixture(true);
  await assert.rejects(o.create(f.db, data(), 7, f.insert), /Receipt write failed/);
  assert.equal(f.rollbacks(), 1);
});

test('manual customer plant size uses the same validation as spreadsheet import', () => {
  assert.deepEqual(o.validate({ ...data(), plant_size_kw: '5.455' }), {
    amount: 10000,
    paid: 2500,
  });
  for (const value of ['0', '-1', '5 kW', '1.2345'])
    assert.throws(() => o.validate({ ...data(), plant_size_kw: value }), /Plant size/);
});
