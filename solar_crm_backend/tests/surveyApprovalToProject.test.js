const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
function modelWithConversion(conversion) {
  const stub = { query: async () => [[]] };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../models/surveyModel.js'), 'utf8'), {
    module, console, require: name => {
      if (name === '../config/db') return { db: stub };
      if (name === '../services/surveyBooking') return { ensure: async () => {} };
      if (name === './projectModel') return { ensureProjectTables: async () => {} };
      if (name === '../utils/managerScope') return {};
      if (name === '../services/surveyConversion') return { convertFeasibleSurvey: conversion };
      throw Error('Unexpected dependency: ' + name);
    },
  });
  return module.exports;
}
function fixture(verdict = 'Feasible') {
  const events = [];
  const connection = { beginTransaction: async () => events.push('begin'), commit: async () => events.push('commit'), rollback: async () => events.push('rollback'), release: () => events.push('release') };
  const db = { query: async sql => sql.includes('SELECT s.*') ? [[{ id: 12, lead_id: 127, status: 'completed', feasibility_verdict: verdict, assigned_engineer_id: 58, customer_name: 'Test Customer' }]] : [[]], getConnection: async () => connection };
  return { db, connection, events };
}
test('legacy conversion entry point uses the same transaction and automatic links', async () => {
  const { db, connection, events } = fixture();
  const model = modelWithConversion(async (received, id, actor) => {
    assert.equal(received, connection); assert.equal(id, 12); assert.equal(actor, 1);
    return { project_id: 99, customer_id: 77, project_number: 'PROJ-TEST' };
  });
  const result = await model.approveSurveyAndCreateProject({ surveyId: 12, approvedBy: 1 }, db);
  assert.equal(result.project_id, 99); assert.equal(result.customer_id, 77);
  assert.equal(result.assigned_to, 58); assert.deepEqual(events, ['begin','commit','release']);
});
test('legacy endpoint cannot create a project for a Not feasible survey', async () => {
  const { db, events } = fixture('Not feasible');
  const model = modelWithConversion(async () => { throw Error('Must not convert'); });
  await assert.rejects(() => model.approveSurveyAndCreateProject({ surveyId: 12 }, db), /completed Feasible/);
  assert.deepEqual(events, []);
});
test('conversion failure rolls back and releases its transaction', async () => {
  const { db, events } = fixture();
  const model = modelWithConversion(async () => { throw Error('Database failure'); });
  await assert.rejects(() => model.approveSurveyAndCreateProject({ surveyId: 12 }, db), /Database failure/);
  assert.deepEqual(events, ['begin','rollback','release']);
});
