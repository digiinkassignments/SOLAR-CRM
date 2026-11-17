const test = require('node:test');
const assert = require('node:assert/strict');
const { convertFeasibleSurvey } = require('../services/surveyConversion');

function database({ verdict = 'Feasible', capacity = 5, status = 'completed', existingCustomer = null, existingProject = null } = {}) {
  const state = { customer: existingCustomer, project: existingProject, calls: [], inserts: 0 };
  const db = { query: async (sql, params) => {
    state.calls.push({ sql, params });
    if (sql.startsWith('SELECT lead_id')) return [[{ lead_id: 10 }]];
    if (sql.startsWith('SELECT * FROM leads')) return [[{ id: 10, customer_name: 'Test Customer', mobile_number: '9000000000', required_kw: capacity, customer_id: state.customer?.id }]];
    if (sql.startsWith('SELECT * FROM site_surveys')) return [[{ id: 7, lead_id: 10, status, feasibility_verdict: verdict, proposed_capacity_kw: capacity, assigned_engineer_id: 4 }]];
    if (sql.startsWith('SELECT id FROM customers')) return [[...(state.customer ? [state.customer] : [])]];
    if (sql.startsWith('SELECT id,project_number')) return [[...(state.project ? [state.project] : [])]];
    if (sql.startsWith('INSERT INTO customers')) { state.customer = { id: 20 }; state.inserts++; return [{ insertId: 20 }]; }
    if (sql.startsWith('INSERT INTO projects')) { state.project = { id: 30, project_number: params[0] }; state.inserts++; return [{ insertId: 30 }]; }
    return [{ affectedRows: 1 }];
  } };
  return { db, state };
}
test('Feasible creates customer and assigned project with linked records', async () => {
  const { db, state } = database();
  const result = await convertFeasibleSurvey(db, 7, 4);
  assert.equal(result.customer_id, 20); assert.equal(result.project_id, 30);
  assert.equal(state.inserts, 2);
  const project = state.calls.find(c => c.sql.startsWith('INSERT INTO projects'));
  assert.equal(project.params[3], 20); assert.equal(project.params[11], 4);
  assert.ok(state.calls.find(c => c.sql.includes('FROM leads') && c.sql.includes('FOR UPDATE')));
  assert.ok(state.calls.find(c => c.sql.includes('approved_by=NULL')));
  assert.ok(!state.calls.some(c => c.sql.includes("status='Won'")));
});
test('retry reuses customer and project without duplicate creation', async () => {
  const { db, state } = database();
  const first = await convertFeasibleSurvey(db, 7, 4);
  const retry = await convertFeasibleSurvey(db, 7, 4);
  assert.deepEqual(retry, first); assert.equal(state.inserts, 2);
});
for (const verdict of ['Not feasible', 'Feasible with conditions', '', null]) {
  test(`${verdict || 'Missing verdict'} does not auto-create a project`, async () => {
    const { db, state } = database({ verdict });
    assert.equal(await convertFeasibleSurvey(db, 7, 4), null); assert.equal(state.inserts, 0);
  });
}
test('scheduled report is not converted before submission', async () => {
  const { db, state } = database({ status: 'scheduled' });
  assert.equal(await convertFeasibleSurvey(db, 7, 4), null); assert.equal(state.inserts, 0);
});
test('existing customer and project are linked without overwriting assignment or stage', async () => {
  const { db, state } = database({ existingCustomer: { id: 41 }, existingProject: { id: 51, project_number: 'EXISTING' } });
  const result = await convertFeasibleSurvey(db, 7, 4);
  assert.equal(result.customer_id, 41); assert.equal(result.project_id, 51); assert.equal(state.inserts, 0);
  assert.ok(!state.calls.some(c => c.sql.startsWith('UPDATE projects') && c.sql.includes('assigned_to')));
});
test('invalid capacity fails instead of inventing a system size', async () => {
  const { db } = database({ capacity: 0 });
  await assert.rejects(() => convertFeasibleSurvey(db, 7, 4), /positive proposed system capacity/);
});
