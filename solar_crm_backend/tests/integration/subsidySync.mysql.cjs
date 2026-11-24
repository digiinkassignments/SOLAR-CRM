const assert = require('node:assert/strict');
const path = require('node:path');
if (process.env.RUN_SUBSIDY_SYNC_MYSQL_QA !== '1') {
  console.log('Set RUN_SUBSIDY_SYNC_MYSQL_QA=1 to run isolated subsidy integration checks.');
  process.exit(0);
}
const root = process.argv[2] || path.resolve(__dirname, '../..');
require(path.join(root, 'node_modules/dotenv')).config({
  path: path.join(root, '.env'),
  quiet: true,
});
const mysql = require(path.join(root, 'node_modules/mysql2/promise'));
const scratch = `qa_subsidy_sync_20261124_${Date.now()}`;
let admin, db, server;
const checks = [];
(async () => {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
  admin = await mysql.createConnection(config);
  const [[tenant]] = await admin.query(
    "SELECT db_name FROM db_digiink_master.clients WHERE subdomain='digiinksolutions' LIMIT 1"
  );
  const source = tenant?.db_name || process.env.DB_NAME;
  assert.match(source, /^\w+$/);
  assert.match(scratch, /^qa_subsidy_sync_20261124_\d+$/);
  await admin.query(
    `CREATE DATABASE \`${scratch}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  db = mysql.createPool({ ...config, database: scratch, connectionLimit: 5 });
  for (const table of [
    'roles',
    'users',
    'leads',
    'customers',
    'projects',
    'notifications',
    'site_surveys',
    'crm_field_tasks',
    'settings',
  ])
    await admin.query(`CREATE TABLE \`${scratch}\`.\`${table}\` LIKE \`${source}\`.\`${table}\``);
  async function seed(table, input) {
    const [columns] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
    const data = { ...input };
    for (const c of columns)
      if (
        c.Null === 'NO' &&
        c.Default === null &&
        !c.Extra.includes('auto_increment') &&
        !(c.Field in data)
      ) {
        data[c.Field] = c.Type.startsWith('enum(')
          ? c.Type.match(/'([^']+)'/)[1]
          : /date|timestamp/.test(c.Type)
            ? '2026-11-19'
            : /int|decimal|float|double/.test(c.Type)
              ? 0
              : /json/.test(c.Type)
                ? '{}'
                : `qa-${input.id}-${c.Field}`.slice(
                    0,
                    Number(c.Type.match(/\((\d+)\)/)?.[1] || 80)
                  );
      }
    await db.query(`INSERT INTO \`${table}\` SET ?`, [data]);
  }
  for (const [id, role_name] of [
    [1, 'Super Admin'],
    [2, 'Manager'],
    [3, 'Sales'],
    [4, 'Site Engineer'],
    [7, 'Finance'],
    [8, 'Application Manager'],
  ])
    await seed('roles', { id, role_name, is_system: 1, status: 'Active' });
  for (const [id, role_id, manager_id] of [
    [1, 1, null],
    [2, 2, null],
    [3, 3, 2],
    [4, 4, null],
    [7, 7, null],
    [8, 8, null],
    [9, 3, null],
  ])
    await seed('users', { id, role_id, manager_id, status: 'Active', is_deleted: 0 });
  const sync = require(path.join(root, 'services/subsidySync'));
  await sync.prepare(db);
  for (const id of [101, 102, 103, 104]) {
    await seed('leads', {
      id,
      customer_name: `QA ${id}`,
      mobile_number: `9876500${id}`,
      assigned_to: id === 104 ? 9 : 3,
      is_deleted: 0,
      solar_requirement: 'Residential',
    });
    await seed('projects', {
      id,
      lead_id: id,
      stage: 'Commissioning',
      system_capacity_kw: 3,
      total_cost: 200000,
      amount_received: 200000,
      is_deleted: 0,
    });
    await db.query('INSERT INTO project_commissioning(project_id,commission_date) VALUES (?,?)', [
      id,
      '2026-11-19',
    ]);
    await sync.initializeProject(db, id);
  }
  const actor = { is_admin: true, can_edit: true };
  const payload = { lead_id: 101, consumer_number: 'TEST', expected_subsidy: 78000 };
  for (const portal_status of [
    'feasibility_approved',
    'vendor_selected',
    'agreement_uploaded',
    'installed_docs_uploaded',
    'net_meter_applied',
    'commissioning_issued',
    'bank_details_submitted',
  ])
    await sync.save(db, { ...payload, portal_status }, 1, actor);
  assert.equal(
    (await db.query('SELECT stage FROM projects WHERE id=101'))[0][0].stage,
    'Commissioning'
  );
  checks.push('bank-details completion does not skip handover');
  const credit = {
    ...payload,
    portal_status: 'subsidy_credited',
    amount_received: 78000,
    credit_date: '2026-11-20',
    utr_number: 'QA-UTR-1',
  };
  await sync.save(db, credit, 8, { can_edit: true });
  let [[p]] = await db.query('SELECT * FROM projects WHERE id=101');
  assert.equal(p.stage, 'Commissioning');
  assert.equal(p.subsidy_pending_handover, 1);
  checks.push('credit before handover saves receipt and pending flag without advancing execution');
  await db.query(
    "INSERT INTO project_handover(project_id,handover_status,handover_date,training_completed,app_demo_completed,customer_signature) VALUES (101,'Completed','2026-11-21','Completed','Completed',1)"
  );
  await sync.syncProject(db, 101, 1);
  [[p]] = await db.query('SELECT * FROM projects WHERE id=101');
  assert.equal(p.stage, 'Warranty Period');
  assert.equal(p.subsidy_pending_handover, 0);
  assert.equal(Number(p.subsidy_received_amount), 78000);
  assert(p.warranty_anchor_date);
  const [[before]] = await db.query(
    'SELECT COUNT(*) AS n FROM project_stage_logs WHERE project_id=101'
  );
  await sync.syncProject(db, 101, 1);
  const [[after]] = await db.query(
    'SELECT COUNT(*) AS n FROM project_stage_logs WHERE project_id=101'
  );
  assert.equal(after.n, before.n);
  checks.push('handover catches up all automatic stages exactly once with warranty anchor');
  await Promise.all([sync.save(db,credit,1,actor),sync.save(db,credit,1,actor)]);
  const [[concurrent]]=await db.query('SELECT COUNT(*) AS n FROM project_stage_logs WHERE project_id=101');
  assert.equal(concurrent.n,before.n);
  checks.push('concurrent duplicate saves do not duplicate lifecycle transitions');
  await assert.rejects(
    sync.save(db, { ...credit, portal_status: 'bank_details_submitted' }, 8, { can_edit: true }),
    { status: 403 }
  );
  await sync.save(
    db,
    {
      ...credit,
      portal_status: 'bank_details_submitted',
      correction_reason: 'Bank credit reversed',
    },
    1,
    actor
  );
  [[p]] = await db.query('SELECT * FROM projects WHERE id=101');
  assert.equal(p.stage, 'Subsidy Applied');
  assert.equal(p.subsidy_reopened, 1);
  assert(p.warranty_anchor_date);
  checks.push('only approved correction rolls back subsidy and retains warranty anchor');
  await sync.save(db, credit, 1, actor);
  await db.query(
    "UPDATE subsidy_applications SET portal_status='bank_details_submitted' WHERE lead_id=102"
  );
  const duplicate = await sync.save(db, { ...credit, lead_id: 102 }, 1, actor);
  assert.equal(duplicate.warnings.length, 1);
  checks.push('duplicate UTR is a warning, not a failed save');
  await assert.rejects(sync.save(db, { ...credit, lead_id: 103 }, 1, actor), { status: 422 });
  checks.push('direct API cannot skip prior tracker stages');
  await db.query(
    "UPDATE subsidy_applications SET portal_status='bank_details_submitted' WHERE lead_id=103"
  );
  const failing = new Proxy(db, {
    get(target, key) {
      if (key === 'getConnection')
        return async () => {
          const c = await target.getConnection();
          return new Proxy(c, {
            get(conn, k) {
              if (k === 'query')
                return async (sql, args) => {
                  if (sql.startsWith('UPDATE projects SET subsidy_pending_handover'))
                    throw Object.assign(new Error('QA injected sync failure'), {
                      code: 'QA_SYNC_FAILURE',
                    });
                  return conn.query(sql, args);
                };
              const value = conn[k];
              return typeof value === 'function' ? value.bind(conn) : value;
            },
          });
        };
      const value = target[key];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  await assert.rejects(
    sync.save(failing, { ...credit, lead_id: 103, utr_number: 'QA-ATOMIC' }, 1, actor),
    { code: 'QA_SYNC_FAILURE' }
  );
  const [[rolled]] = await db.query(
    'SELECT portal_status FROM subsidy_applications WHERE lead_id=103'
  );
  assert.equal(rolled.portal_status, 'bank_details_submitted');
  checks.push('injected synchronization failure rolls back the entire tracker save');
  const express = require(path.join(root, 'node_modules/express'));
  const jwt = require(path.join(root, 'node_modules/jsonwebtoken'));
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.db = db;
    next();
  });
  app.use('/api/subsidy', require(path.join(root, 'routes/subsidyRoutes')));
  const verify = require(path.join(root, 'middleware/authMiddleware')).verifyToken;
  const controller = require(path.join(root, 'controllers/projectController'));
  app.put('/api/projects/:id/stage', verify, controller.updateProjectStage);
  app.put('/api/projects/:id', verify, controller.updateProject);
  const handover = require(path.join(root, 'controllers/handoverController'));
  app.post('/api/projects/:id/handover', verify, handover.create);
  server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  async function request(userId, url, method = 'GET', body) {
    const [[user]] = await db.query('SELECT role_id FROM users WHERE id=?', [userId]);
    const token = jwt.sign(
      { id: userId, role_id: user.role_id },
      process.env.JWT_SECRET || 'qa-only-secret',
      { expiresIn: '5m' }
    );
    return fetch(`http://127.0.0.1:${server.address().port}${url}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  for (const id of [1, 2, 3, 4, 7, 8]) {
    const response = await request(id, '/api/subsidy/apply', 'POST', {
      lead_id: 103,
      consumer_number: 'TEST',
    });
    assert.equal(response.status, [1, 8].includes(id) ? 200 : 403);
  }
  checks.push('all six role APIs enforce tracker write permissions');
  const response = await request(3, '/api/subsidy/101');
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.data.can_edit, false);
  assert.equal(data.data.application.utr_number, null);
  assert.equal((await request(9, '/api/subsidy/101')).status, 404);
  const ownList = await (await request(3, '/api/subsidy/list')).json();
  assert(!ownList.data.subsidies.some((row) => String(row.lead_id) === '104'));
  checks.push('sales sees only own application records and masked credit details');
  for (const url of ['/api/projects/101/stage', '/api/projects/101'])
    assert.equal((await request(1, url, 'PUT', { stage: 'Subsidy Received' })).status, 409);
  checks.push('stage and general-edit APIs reject manual received stage even for Super Admin');
  assert.equal((await request(7, '/api/subsidy/101')).status, 200);
  await db.query('UPDATE projects SET assigned_to=4 WHERE id=101');
  assert.equal((await request(4, '/api/subsidy/101')).status, 200);
  assert.equal((await request(4, '/api/subsidy/104')).status, 404);
  checks.push('finance is read-only and engineer reads stay limited to assigned work');
  const completion = {
    handover_status: 'Completed',
    handover_date: '2026-11-21',
    training_completed: 'Completed',
    app_demo_completed: 'Completed',
    customer_signature: 1,
  };
  assert.equal((await request(1, '/api/projects/103/handover', 'POST', completion)).status, 422);
  await db.query(
    "INSERT INTO project_final_inspection(project_id,inspection_status) VALUES (103,'Approved')"
  );
  const savedHandover = await request(1, '/api/projects/103/handover', 'POST', completion);
  if (savedHandover.status !== 201) console.error(await savedHandover.clone().text());
  assert.equal(savedHandover.status, 201);
  assert.equal(
    (await db.query('SELECT stage FROM projects WHERE id=103'))[0][0].stage,
    'Subsidy Applied'
  );
  checks.push('handover API keeps final-inspection gate and completes without subsidy credit');
  const rejection = await request(8, '/api/subsidy/reject', 'POST', {
    lead_id: 103,
    rejection_category: 'Bank Query',
    rejection_reason: 'Portal requested confirmation',
    fix_task: 'Application Manager to recheck IFSC',
  });
  assert.equal(rejection.status, 200);
  assert.equal(
    (await db.query('SELECT stage FROM projects WHERE id=103'))[0][0].stage,
    'Subsidy Applied'
  );
  checks.push('rejection creates fix task and keeps handed-over project at Subsidy Applied');
  for (const [id, category] of [
    [105, 'Residential'],
    [106, 'Commercial'],
  ]) {
    await seed('customers', {
      id,
      customer_name: `QA customer ${id}`,
      solar_requirement: category,
    });
    await seed('projects', {
      id,
      lead_id: null,
      customer_id: id,
      stage: 'Commissioning',
      assigned_to: 4,
      is_deleted: 0,
    });
    await sync.initializeProject(db, id);
  }
  const direct = await (await request(1, '/api/subsidy/project-105')).json();
  assert.equal(direct.data.application.project_id, 105);
  const commercial = (await db.query('SELECT subsidy_applicable FROM projects WHERE id=106'))[0][0];
  assert.equal(commercial.subsidy_applicable, 0);
  await db.query(
    "INSERT INTO project_handover(project_id,handover_status,handover_date) VALUES (106,'Completed','2026-11-21')"
  );
  await sync.syncProject(db, 106, 1);
  assert.equal(
    (await db.query('SELECT stage FROM projects WHERE id=106'))[0][0].stage,
    'Warranty Period'
  );
  checks.push('lead-less residential customer gets tracker; commercial handover skips subsidy');
  await db.query(
    "UPDATE subsidy_applications SET portal_status='subsidy_credited',amount_received=0,credit_date=NULL,utr_number=NULL WHERE lead_id=104"
  );
  await db.query(
    "INSERT INTO project_handover(project_id,handover_status,handover_date) VALUES (104,'Completed','2026-11-21')"
  );
  await sync.syncProject(db, 104, 1);
  const [[invalidLegacy]] = await db.query(
    'SELECT stage,subsidy_legacy_manual FROM projects WHERE id=104'
  );
  assert.equal(invalidLegacy.stage, 'Subsidy Applied');
  assert.equal(invalidLegacy.subsidy_legacy_manual, 1);
  checks.push(
    'incomplete historical credit is flagged without blocking handover or fabricating receipt'
  );
  const reconciliation = require(path.join(root, 'services/subsidyReconciliation'));
  const legacy = await reconciliation.migrateLegacy(db);
  assert(legacy.before.projects.length > 0);
  assert.equal((await reconciliation.migrateLegacy(db)).already_applied, true);
  const reconciled = await reconciliation.reconcile(db);
  assert.equal(reconciled.failed, 0);
  checks.push('legacy migration is backed up and one-time; reconciliation runs successfully');
  // Token is intentionally issued before downgrading the account.
  const stale = jwt.sign({ id: 8, role_id: 8 }, process.env.JWT_SECRET || 'qa-only-secret', {
    expiresIn: '5m',
  });
  await db.query('UPDATE users SET role_id=3 WHERE id=8');
  const revoked = await fetch(`http://127.0.0.1:${server.address().port}/api/subsidy/apply`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${stale}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_id: 103 }),
  });
  assert.equal(revoked.status, 403);
  checks.push('role downgrade revokes a previously issued editor token immediately');
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
})()
  .catch((error) => {
    console.error(error.stack);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (db) await db.end();
    if (admin) {
      assert.match(scratch, /^qa_subsidy_sync_20261124_\d+$/);
      await admin.query(`DROP DATABASE IF EXISTS \`${scratch}\``);
      await admin.end();
    }
    try {
      await require(path.join(root, 'config/db')).db.end();
    } catch {}
  });
