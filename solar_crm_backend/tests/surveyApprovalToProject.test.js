const test = require('node:test');
const assert = require('node:assert/strict');
const surveyModel = require('../models/surveyModel');

test('approveSurveyAndCreateProject creates project, assigns site engineer, and updates lead & survey', async () => {
  let createdProject = null;
  let stageLogs = [];
  let updatedSurveys = [];
  let updatedLeads = [];
  let activityLogs = [];

  const fakeDb = {
    query: async (sql, params = []) => {
      // 1. Table schema checks
      if (sql.includes('CREATE TABLE') || sql.includes('ALTER TABLE') || sql.includes('SHOW TABLES') || sql.includes('SHOW COLUMNS')) {
        return [[]];
      }
      // 2. Fetch survey
      if (sql.includes('SELECT s.*') && sql.includes('WHERE s.id = ?')) {
        return [[{
          id: 12,
          lead_id: 127,
          assigned_engineer_id: 58,
          proposed_capacity_kw: 3.5,
          feasibility_verdict: 'Feasible',
          site_address: 'Jaipur, Rajasthan',
          site_notes: 'All good for solar',
        }]];
      }
      // 3. Fetch lead
      if (sql.includes('SELECT * FROM leads WHERE id = ?')) {
        return [[{
          id: 127,
          lead_code: 'LD000127',
          customer_name: 'Pooja Rathore',
          mobile_number: '9928901234',
          address: 'Jaipur',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302021',
          required_kw: 3.0,
        }]];
      }
      // 4. Check existing projects
      if (sql.includes('SELECT id, project_number, project_uuid, stage, assigned_to FROM projects WHERE lead_id = ?')) {
        return [[]]; // No existing project
      }
      // 5. Insert project
      if (sql.includes('INSERT INTO projects')) {
        createdProject = {
          insertId: 99,
          params,
        };
        return [{ insertId: 99 }];
      }
      // 6. Stage logs
      if (sql.includes('INSERT INTO project_stage_logs')) {
        stageLogs.push(params);
        return [{ insertId: 1 }];
      }
      // 7. Update survey
      if (sql.includes('UPDATE site_surveys SET')) {
        updatedSurveys.push(params);
        return [{ affectedRows: 1 }];
      }
      // 8. Update leads
      if (sql.includes('UPDATE leads SET status =')) {
        updatedLeads.push(params);
        return [{ affectedRows: 1 }];
      }
      // 9. Activity logs
      if (sql.includes('INSERT INTO lead_activity_logs')) {
        activityLogs.push(params);
        return [{ insertId: 1 }];
      }
      return [[]];
    },
  };

  const res = await surveyModel.approveSurveyAndCreateProject(
    {
      surveyId: 12,
      approvedBy: 1,
      notes: 'Approved by admin',
    },
    fakeDb
  );

  assert.equal(res.project_id, 99);
  assert.match(res.project_number, /^PROJ-\d{4}-\d+$/);
  assert.equal(res.assigned_to, 58);
  assert.equal(res.lead_id, 127);
  assert.equal(res.stage, 'Pre-Install Inspection');
  assert.equal(res.customer_name, 'Pooja Rathore');

  // Verify project insert params
  assert.ok(createdProject);
  assert.equal(createdProject.params[2], 127); // actualLeadId
  assert.equal(createdProject.params[3], 'Pooja Rathore');
  assert.equal(createdProject.params[4], '9928901234');
  assert.equal(createdProject.params[9], 3.5); // capacity from survey.proposed_capacity_kw
  assert.equal(createdProject.params[10], 'Pre-Install Inspection');
  assert.equal(createdProject.params[11], 58); // assigned to engineer 58

  // Verify survey was updated to approved with project_id
  assert.equal(updatedSurveys.length, 1);
  assert.deepEqual(updatedSurveys[0], [1, 99, 12]); // approvedBy=1, project_id=99, surveyId=12

  // Verify lead was moved to 'Project In Progress'
  assert.equal(updatedLeads.length, 1);
  assert.equal(updatedLeads[0][0], 127);
});

