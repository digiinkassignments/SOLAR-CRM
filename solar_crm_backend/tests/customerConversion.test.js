const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function fixture({ denied = false, existing = false, plant = 5 } = {}) {
  let created;
  const queries = [];
  const customer = { id: 12, lead_id: null, customer_name: 'Saved customer', mobile_number: '9876543210', address: 'Saved site', city: 'Jaipur' };
  const db = { async query(sql) {
    queries.push(sql);
    if (sql.startsWith('SELECT * FROM customers')) return [[customer]];
    if (sql.includes('ORDER BY id LIMIT 1')) return [existing ? [{ id: 'P1', project_number: 'PRJ1' }] : []];
    if (sql.startsWith('SELECT id,project_number FROM projects WHERE id=')) return [[{ id: 'P1', project_number: 'PRJ1' }]];
    return [{}];
  } };
  const dependencies = {
    '../config/db': { db },
    '../services/customerWorkspace': { async accessibleCustomer() { if (denied) throw Object.assign(new Error('Customer not found.'), { status: 404 }); return { id: 12, lead_id: null }; } },
    '../services/customerOpening': { async records() { return [{ plant_size_kw: plant }]; } },
    '../models/projectModel': { async createProject(_db, data) { created = data; return 'P1'; } },
    './customerDeletionController': { archive() {} },
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controllers/customerController.js'), 'utf8'), {
    module, require: (name) => dependencies[name] || {}, console,
  });
  const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } };
  return { run: () => module.exports.convertCustomerToProject({ db, params: { id: 12 }, user: { id: 1 }, body: {} }, res), res, queries, created: () => created };
}

test('conversion uses saved profile and opening plant size after authorization', async () => {
  const f = fixture(); await f.run();
  assert.equal(f.res.code, 201);
  assert.equal(f.created().customer_name, 'Saved customer');
  assert.equal(f.created().customer_address, 'Saved site');
  assert.equal(f.created().system_capacity_kw, 5);
});
test('out-of-scope customer cannot be read or converted', async () => {
  const f = fixture({ denied: true }); await f.run();
  assert.equal(f.res.code, 404); assert.equal(f.queries.length, 0); assert.equal(f.created(), undefined);
});
test('existing project is reused and missing capacity does not create a project', async () => {
  const old = fixture({ existing: true }); await old.run();
  assert.equal(old.res.body.existing, true); assert.equal(old.created(), undefined);
  const empty = fixture({ plant: 0 }); await empty.run();
  assert.equal(empty.res.code, 400); assert.equal(empty.created(), undefined);
});
