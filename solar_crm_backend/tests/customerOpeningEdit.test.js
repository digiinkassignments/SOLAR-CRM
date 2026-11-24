const test = require('node:test'),
  assert = require('node:assert/strict'),
  o = require('../services/customerOpening');
function fixture(old) {
  let saved,
    commits = 0,
    rollbacks = 0;
  const c = {
    beginTransaction: async () => {},
    commit: async () => commits++,
    rollback: async () => rollbacks++,
    release() {},
    query: async (sql, p) => {
      if (sql.startsWith('SELECT id')) return [[{ id: 7 }]];
      if (sql.startsWith('SELECT *,')) return [[old].filter(Boolean)];
      if (sql.startsWith('UPDATE customer_opening')) return [{}];
      if (sql.startsWith('INSERT')) {
        saved = p;
        return [{}];
      }
      throw Error(sql);
    },
  };
  return {
    db: { query: async () => [[]], getConnection: async () => c },
    saved: () => saved,
    commits: () => commits,
    rollbacks: () => rollbacks,
  };
}
test('editing imported record replaces amounts, retains identity and clears empty fields', async () => {
  const f = fixture({
    request_key: 'original-import-key',
    payload_hash: 'originalhash',
    invoice_amount: '190000',
    amount_paid: '136500',
    payment_date: '2026-11-19',
    payment_mode: 'Bank Transfer',
    plant_size_kw: '3',
  });
  let save = 0;
  await o.update(
    f.db,
    7,
    {
      invoice_amount: '200000',
      payment_amount: '150000',
      payment_date: '2026-11-18',
      plant_size_kw: '5.455',
      invoice_reference: '',
    },
    async () => save++
  );
  assert.equal(save, 1);
  assert.equal(f.commits(), 1);
  assert.deepEqual(f.saved().slice(0, 9), [
    7,
    'original-import-key',
    'originalhash',
    200000,
    150000,
    null,
    '2026-11-18',
    'Bank Transfer',
    null,
  ]);
  assert.equal(f.saved()[9], '5.455');
});
test('invalid payment rolls back without saving profile', async () => {
  const f = fixture();
  let save = 0;
  await assert.rejects(
    o.update(f.db, 7, { invoice_amount: '100', payment_amount: '-1' }, async () => save++),
    /non-negative/
  );
  assert.equal(save, 0);
  assert.equal(f.rollbacks(), 1);
});
test('customer without opening can receive record and zero payment clears payment metadata', async () => {
  const f = fixture();
  await o.update(
    f.db,
    7,
    { invoice_amount: '100', payment_amount: '0', payment_date: '', plant_size_kw: '' },
    async () => {}
  );
  assert.equal(f.saved()[3], 100);
  assert.equal(f.saved()[4], 0);
  assert.equal(f.saved()[6], null);
  assert.equal(f.saved()[9], null);
});
test('write failure rolls back profile and opening together', async () => {
  const f = fixture();
  await assert.rejects(
    o.update(f.db, 7, { invoice_amount: '100' }, async () => {
      throw Error('save failed');
    }),
    /save failed/
  );
  assert.equal(f.commits(), 0);
  assert.equal(f.rollbacks(), 1);
});
