const test = require('node:test'), assert = require('node:assert/strict');
const plans = require('../services/amcPlans');
const valid = { name: 'Care Plus', coverage: 'Cleaning and inverter inspection', exclusions: 'Replacement parts', annual_amount: '3600', visit_frequency: 'Quarterly', term_months: 12, is_active: true };
test('company plans validate fees, terms and coverage without predefined plan names', () => {
  assert.equal(plans.validate(valid).name, 'Care Plus');
  for (const bad of [{ annual_amount: -1 }, { annual_amount: '' }, { term_months: 0 }, { term_months: 1.2 }, { coverage: '' }, { name: 'x'.repeat(61) }, { visit_frequency: 'Never' }, { is_active: 'true' }]) assert.throws(() => plans.validate({ ...valid, ...bad }), { status: 400 });
});
test('contract snapshots survive catalog changes and reject stale/archived selections', async () => {
  let queries = 0;
  const db = { query: async sql => { if (sql.startsWith('CREATE')) return []; queries++; return [[{ id: 3, ...valid, name: 'Updated name', annual_amount: 5000, version: 2 }]]; } };
  const existing = { amc_plan_id: 3, amc_plan: 'Original name', amc_plan_snapshot: { ...valid, annual_amount: 3600, version: 1 } };
  const retained = await plans.warrantySelection(db, { amc_plan_id: 3, amc_amount: 3200, amc_plan_snapshot: { coverage: 'Injected terms' } }, existing);
  assert.equal(queries, 0); assert.equal(retained.amc_plan, 'Original name'); assert.equal(retained.amc_plan_snapshot.coverage, valid.coverage); assert.equal(retained.amc_amount, 3200);
  const chosen = await plans.warrantySelection(db, { amc_plan_id: 3, amc_apply_plan: true, amc_plan_version: 2 }, existing);
  assert.equal(chosen.amc_plan_snapshot.annual_amount, 5000); assert.equal(chosen.amc_plan, 'Updated name');
  await assert.rejects(plans.warrantySelection(db, { amc_plan_id: 3, amc_apply_plan: true, amc_plan_version: 1 }, existing), { status: 409 });
  const archivedDb = { query: async () => [[]] };
  await assert.rejects(plans.warrantySelection(archivedDb, { amc_plan_id: 3, amc_plan_version: 2 }, null), { status: 409 });
  assert.equal((await plans.warrantySelection(db, { amc_plan: 'Basic' }, { amc_plan: 'Basic' })).amc_plan_snapshot, null);
  await assert.rejects(plans.warrantySelection(db, { amc_plan: 'Invented plan' }, null), { status: 400 });
});
test('warranty SQL persists plan ID and snapshot with matching parameter counts', async () => {
  const model = require('../models/warrantyModel'); let insert, update;
  const db = { query: async (sql, args = []) => {
    assert.equal((sql.match(/\?/g) || []).length, args.length, sql);
    if (sql.startsWith('INSERT')) insert = { sql, args }; if (sql.startsWith('UPDATE')) update = { sql, args };
    return [{ insertId: 9 }];
  } };
  const data = { ...valid, amc_plan_id: 3, amc_plan_snapshot: valid, panel_warranty_years: 25 };
  await model.createWarranty(db, 1, data, 2); await model.updateWarranty(db, 1, data);
  assert.match(insert.sql, /amc_plan_id, amc_plan_snapshot/); assert.equal(insert.args.at(-2), 3); assert.equal(JSON.parse(insert.args.at(-1)).name, valid.name);
  assert.equal(update.args.at(-3), 3); assert.equal(JSON.parse(update.args.at(-2)).coverage, valid.coverage);
});
test('AMC API isolates tenant catalogs, restricts editing and detects concurrent updates', async () => {
  const express = require('express'), jwt = require('jsonwebtoken'); process.env.JWT_SECRET = 'amc-local-test-only';
  const app = express(); app.use(express.json());
  const dbs = { 1: { rows: [] }, 2: { rows: [] } };
  app.use((req, res, next) => {
    const tenant = Number(req.headers['x-test-tenant'] || 1), store = dbs[tenant]; req.clientInfo = { id: tenant };
    req.db = { query: async (sql, p = []) => {
      if (sql.startsWith('CREATE')) return [];
      if (sql.startsWith('SELECT')) return [store.rows];
      if (sql.startsWith('INSERT')) { const id = store.rows.length + 1; store.rows.push({ id, name: p[0], coverage: p[1], version: 1 }); return [{ insertId: id }]; }
      if (sql.startsWith('UPDATE')) { const row = store.rows.find(r => r.id === p[8] && r.version === p[9]); if (!row) return [{ affectedRows: 0 }]; row.name = p[0]; row.version++; return [{ affectedRows: 1 }]; }
      assert.fail(sql);
    } }; next();
  });
  app.use('/amc-plans', require('../routes/amcPlanRoutes'));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/amc-plans`;
  const call = async (role, method = 'GET', body, path = '', tenant = 1, claim = tenant) => {
    const token = jwt.sign({ id: 1, role_id: role, client_id: claim }, process.env.JWT_SECRET);
    const r = await fetch(base + path, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-test-tenant': String(tenant) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: r.status, body: await r.text() };
  };
  try {
    assert.equal((await call(1, 'POST', valid)).status, 201);
    assert.match((await call(2)).body, /Care Plus/);
    assert.equal((await call(2, 'POST', valid)).status, 403);
    assert.equal((await call(3)).status, 403); assert.equal((await call(4)).status, 403);
    assert.equal((await call(1, 'GET', null, '', 2, 1)).status, 403);
    assert.deepEqual(JSON.parse((await call(1, 'GET', null, '', 2)).body).plans, []);
    assert.equal((await call(1, 'PUT', { ...valid, name: 'Updated', version: 1 }, '/1')).status, 200);
    assert.equal((await call(1, 'PUT', { ...valid, version: 1 }, '/1')).status, 409);
  } finally { await new Promise(r => server.close(r)); }
});
