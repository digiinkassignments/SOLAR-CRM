const assert = require('node:assert/strict');
const path = require('node:path');
if (process.env.RUN_CUSTOMER_COLLECTIONS_MYSQL_QA !== '1') {
  console.log('Set RUN_CUSTOMER_COLLECTIONS_MYSQL_QA=1 to run isolated MySQL QA.');
  process.exit(0);
}
const root = process.argv[2] || path.resolve(__dirname, '../..');
require(path.join(root, 'node_modules/dotenv')).config({
  path: path.join(root, '.env'),
  quiet: true,
});
const mysql = require(path.join(root, 'node_modules/mysql2/promise'));
const name = 'qa_customer_collections_20261124_' + Date.now();
let admin, db, server;
const checks = [];
(async () => {
  admin = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  let source = process.env.DB_NAME || 'solar_crm';
  const [tenants] = await admin.query(
    "SELECT db_name FROM db_digiink_master.clients WHERE subdomain='digiinksolutions' LIMIT 1"
  );
  if (tenants[0]) source = tenants[0].db_name;
  assert.match(source, /^\w+$/);
  assert.match(name, /^qa_customer_collections_20261124_\d+$/);
  await admin.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: name,
    connectionLimit: 5,
  });
  const tables = [
    'customers',
    'leads',
    'users',
    'roles',
    'projects',
    'quotations',
    'invoices',
    'invoice_payments',
    'lead_followups',
    'lead_activity_logs',
    'solar_loans',
    'notifications',
  ];
  for (const table of tables)
    await admin.query(`CREATE TABLE \`${name}\`.\`${table}\` LIKE \`${source}\`.\`${table}\``);
  async function seed(table, values) {
    const [columns] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
    const data = { ...values };
    for (const c of columns) {
      if (
        c.Null === 'NO' &&
        c.Default === null &&
        !c.Extra.includes('auto_increment') &&
        !(c.Field in data)
      )
        data[c.Field] = c.Type.startsWith('enum(')
          ? c.Type.match(/'([^']+)'/)[1]
          : /date|timestamp/.test(c.Type)
            ? '2026-11-24'
            : /int|decimal|float|double/.test(c.Type)
              ? 0
              : /json/.test(c.Type)
                ? '{}'
                : `qa-${values.id}-${c.Field}`.slice(
                    0,
                    Number(c.Type.match(/\((\d+)\)/)?.[1] || 100)
                  );
    }
    await db.query(`INSERT INTO \`${table}\` SET ?`, [data]);
  }
  for (const [id, role_name] of [
    [1, 'Super Admin'],
    [2, 'Manager'],
    [3, 'Sales'],
    [8, 'Finance'],
  ])
    await seed('roles', { id, role_name, is_system: 1, status: 'Active' });
  for (const [id, role_id, manager_id] of [
    [1, 1, null],
    [2, 2, null],
    [3, 3, 2],
    [4, 3, null],
    [8, 8, null],
  ])
    await seed('users', {
      id,
      role_id,
      manager_id,
      full_name: 'QA User ' + id,
      email: `qa${id}@example.invalid`,
      status: 'Active',
      is_deleted: 0,
    });
  for (const [id, assigned_to] of [
    [1, 3],
    [2, 4],
    [3, 3],
  ])
    await seed('customers', {
      id,
      customer_code: 'QA-' + id,
      customer_name: 'QA Customer ' + id,
      mobile_number: '987650000' + id,
      assigned_to,
      created_by: 1,
      status: 'Active',
    });
  await seed('invoices', {
    id: 1,
    customer_id: 1,
    invoice_number: 'QA-INV-1',
    public_token: 'qa-invoice-1',
    gross_total: 1000,
    net_payable_amount: 1000,
    amount_paid: 400,
    balance_due: 600,
    invoice_date: '2026-11-01',
    due_date: '2026-11-20',
    status: 'Issued',
  });
  await seed('invoices', {
    id: 2,
    customer_id: 1,
    invoice_number: 'QA-INV-2',
    public_token: 'qa-invoice-2',
    gross_total: 1000,
    net_payable_amount: 1000,
    amount_paid: 1300,
    balance_due: 0,
    invoice_date: '2026-11-01',
    due_date: '2026-11-20',
    status: 'Issued',
  });
  const service = require(path.join(root, 'services/customerCollections'));
  const express = require(path.join(root, 'node_modules/express')),
    jwt = require(path.join(root, 'node_modules/jsonwebtoken'));
  process.env.JWT_SECRET = 'isolated-collections-qa-secret';
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.db = db;
    req.clientInfo = { id: 11 };
    if (req.headers['x-qa-finance']) req.portalRole = 'finance';
    next();
  });
  app.use(require(path.join(root, 'middleware/managerContext')));
  app.use('/api/customers', require(path.join(root, 'routes/customerRoutes')));
  app.use('/api/quotations', require(path.join(root, 'routes/quotationRoutes')));
  app.use('/api/reports', require(path.join(root, 'routes/reportRoutes')));
  server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const url = 'http://127.0.0.1:' + server.address().port;
  async function request(route, user = { id: 1, role_id: 1, client_id: 11 }, body, method) {
    const headers = { 'content-type': 'application/json' };
    if (user) headers.authorization = 'Bearer ' + jwt.sign(user, process.env.JWT_SECRET);
    if (user?.portal_role === 'finance') headers['x-qa-finance'] = '1';
    const r = await fetch(url + (route.startsWith('/api/') ? route : '/api/customers' + route), {
      headers,
      method: method || (body ? 'POST' : 'GET'),
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: r.status, data };
  }
  let r = await request('/directory');
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.data.totals.outstanding, 600);
  assert.equal(r.data.data.totals.refund_due, 300);
  checks.push('directory totals and both invoice balances');
  r = await request('/directory', { id: 2, role_id: 2, client_id: 11 });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.data.rows.length, 2);
  checks.push('manager team scope');
  r = await request('/2/collections', { id: 3, role_id: 3, client_id: 11 });
  assert.equal(r.status, 404);
  checks.push('sales cross-customer denial');
  r = await request('/directory', { id: 8, role_id: 8, portal_role: 'finance', client_id: 11 });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  r = await request('/directory', null);
  assert.equal(r.status, 401);
  r = await request('/directory', { id: 1, role_id: 1, client_id: 99 });
  assert.equal(r.status, 403);
  checks.push('authentication and tenant mismatch denial');
  r = await request('/1/collection-payment', { id: 3, role_id: 3, client_id: 11 }, { amount: 10 });
  assert.equal(r.status, 403);
  checks.push('sales amount mutation denied');
  r = await request(
    '/1/collections',
    { id: 3, role_id: 3, client_id: 11 },
    { action: 'promise', note: 'Customer promised tomorrow', promised_date: '2030-11-25' }
  );
  assert.equal(r.status, 200, JSON.stringify(r.data));
  r = await request(
    '/1/collections',
    { id: 3, role_id: 3, client_id: 11 },
    { action: 'note', note: 'Second call' }
  );
  assert.equal(r.status, 200);
  r = await request('/directory?followup=Promised%20to%20pay');
  assert.equal(r.data.data.rows.length, 1);
  assert.equal(r.data.data.rows[0].promised_date, '2030-11-25');
  checks.push('promise task persists after note');
  r = await request(
    '/1/collection-due-date',
    undefined,
    { record_key: 'invoice-1', due_date: '2026-12-01' },
    'PUT'
  );
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const pay = {
    amount: '100',
    record_key: 'invoice-1',
    invoice_id: 1,
    payment_date: '2026-11-24',
    payment_mode: 'UPI',
    request_key: 'qa-payment-request-111',
  };
  r = await request('/1/collection-payment', undefined, pay);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  r = await request('/1/collection-payment', undefined, pay);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  let [[i]] = await db.query('SELECT amount_paid FROM invoices WHERE id=1');
  assert.equal(Number(i.amount_paid), 500);
  checks.push('invoice payment retry idempotency');
  const refund = {
    amount: '50',
    record_key: 'invoice-2',
    invoice_id: 2,
    refund_date: '2026-11-24',
    refund_mode: 'UPI',
    request_key: 'qa-refund-request-111',
  };
  r = await request('/1/refunds', undefined, refund);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  r = await request('/1/refunds', undefined, refund);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  r = await request('/1/collections');
  assert.equal(r.data.data.ledger.refund_due, 250);
  assert.equal(r.data.data.ledger.balance_due, 500);
  checks.push('refund retry and invoice-specific balance');
  r = await request('/1/refunds', undefined, {
    ...refund,
    request_key: 'qa-refund-too-high-111',
    amount: '251',
  });
  assert.equal(r.status, 409);
  r = await request('/1/credit-notes', undefined, {
    invoice_id: 1,
    amount: '100',
    credit_date: '2026-11-24',
    reference: 'QA-CN',
    request_key: 'qa-credit-request-111',
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  r = await request('/1/collections');
  assert.equal(r.data.data.ledger.balance_due, 400);
  checks.push('credit notes reduce final amount');
  r = await request('/directory?balance=outstanding&export=csv');
  assert.equal(r.status, 200);
  assert.match(r.data, /QA Customer 1/);
  checks.push('filtered CSV export');
  r = await request(
    '/directory/bulk',
    { id: 3, role_id: 3, client_id: 11 },
    { ids: [2], action: 'export' }
  );
  assert.equal(r.status, 404);
  checks.push('bulk export scope denial');
  // Opening receipts and parallel writes share a customer lock.
  await require(path.join(root, 'services/customerOpening')).create(
    db,
    { request_key: 'qa-opening-record-111', invoice_amount: '100', payment_amount: '0' },
    1,
    async () => ({ id: 3 })
  );
  const openingPay = {
    amount: '80',
    record_key: 'opening',
    payment_date: '2026-11-24',
    payment_mode: 'Cash',
  };
  const pair = await Promise.all([
    request('/3/collection-payment', undefined, {
      ...openingPay,
      request_key: 'qa-parallel-payment-1',
    }),
    request('/3/collection-payment', undefined, {
      ...openingPay,
      request_key: 'qa-parallel-payment-2',
    }),
  ]);
  assert.deepEqual(pair.map((x) => x.status).sort(), [200, 409]);
  checks.push('concurrent overpayment rejected');

  const quotePayload = {
    customer_name: 'QA Quote',
    customer_phone: '9876543210',
    system_capacity_kw: 3,
    base_price: 100,
    gst_mode: 'itemised',
    gst_rate: 0,
    payment_schedule: [{ title: 'Payment', percent: 100, due_date: '2026-12-01' }],
  };
  r = await request('/api/quotations', undefined, quotePayload);
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const quoteId = r.data.data.id;
  r = await request(
    '/api/quotations/' + quoteId,
    undefined,
    { ...quotePayload, expected_revision: r.data.data.revision_number },
    'PUT'
  );
  assert.equal(r.status, 200, JSON.stringify(r.data));
  r = await request('/api/quotations', undefined, {
    ...quotePayload,
    payment_schedule: [{ title: 'Bad', percent: 20, due_date: '2026-12-01' }],
  });
  assert.equal(r.status, 400, JSON.stringify(r.data));
  checks.push('quotation create/edit schedule and invalid schedule rejection');
  r = await request('/api/reports/financials');
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.data.ledgerSummary.outstanding, 420);
  assert.equal(r.data.data.ledgerSummary.refundDue, 250);
  checks.push('reports share the customer invoice ledger');
  // Structured quotation dates create an invoice plan once and survive repeat reads.
  await require(path.join(root, 'services/quotationPaymentSchedule')).ensure(db);
  await seed('quotations', {
    id: 11,
    quotation_number: 'QA-QUOTE-11',
    public_token: 'qa-quote-11',
    payment_schedule_json: JSON.stringify([
      { title: 'Advance', percent: 20, due_date: '2026-11-27' },
      { title: 'Dispatch', percent: 80, due_date: '2026-12-05' },
    ]),
  });
  await seed('invoices', {
    id: 11,
    customer_id: 1,
    quotation_id: 11,
    invoice_number: 'QA-INV-11',
    public_token: 'qa-invoice-11',
    gross_total: 100,
    net_payable_amount: 100,
    amount_paid: 0,
    invoice_date: '2026-11-24',
    status: 'Issued',
  });
  await service.detail(db, 1, { id: 1, role_id: 1 });
  await service.detail(db, 1, { id: 1, role_id: 1 });
  const [[plan]] = await db.query(
    'SELECT COUNT(*) count,SUM(amount) amount FROM customer_payment_milestones WHERE invoice_id=11'
  );
  assert.equal(Number(plan.count), 2);
  assert.equal(Number(plan.amount), 100);
  checks.push('quotation schedule creates dated invoice milestones exactly once');
  const reminderJob = require(path.join(root, 'services/customerCollectionReminders'));
  await reminderJob.processTenant(db, new Date('2026-11-24T06:00:00Z'));
  const [[n1]] = await db.query('SELECT COUNT(*) count FROM notifications');
  await reminderJob.processTenant(db, new Date('2026-11-24T07:00:00Z'));
  const [[n2]] = await db.query('SELECT COUNT(*) count FROM notifications');
  assert(Number(n1.count) > 0);
  assert.equal(n1.count, n2.count);
  checks.push('tenant-timezone reminder delivery is deduplicated');
  // More than legacy 150 records must contribute to cards and export.
  for (let id = 10; id < 165; id++)
    await seed('customers', {
      id,
      customer_code: 'QA-' + id,
      customer_name: 'QA Customer ' + id,
      mobile_number: '98766' + String(id).padStart(5, '0'),
      assigned_to: 3,
      created_by: 1,
      status: 'Active',
    });
  r = await request('/directory');
  assert.equal(r.data.data.totals.customers, 158);
  assert.equal(r.data.data.rows.length, 20);
  checks.push('full directory totals beyond 150 with pagination');
  console.log(JSON.stringify({ passed: checks.length, checks }));
})()
  .catch((e) => {
    console.error(e.stack);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) await new Promise((r) => server.close(r));
    if (db) await db.end();
    if (admin) {
      if (/^qa_customer_collections_20261124_\d+$/.test(name))
        await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
      await admin.end();
    }
    process.exit(process.exitCode || 0);
  });
