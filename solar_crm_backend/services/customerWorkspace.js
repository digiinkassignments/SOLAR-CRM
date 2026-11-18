const crypto = require('crypto');
const ready = new WeakMap();
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
async function ensure(db) {
  if (!ready.has(db)) ready.set(db, (async () => {
    const [columns] = await db.query("SHOW COLUMNS FROM customers LIKE 'lead_source'");
    if (!columns.length) {
      try { await db.query('ALTER TABLE customers ADD COLUMN lead_source VARCHAR(150) NULL'); }
      catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }
    }
    await db.query(`CREATE TABLE IF NOT EXISTS customer_import_batches (
      request_key VARCHAR(80) PRIMARY KEY, payload_hash CHAR(64) NOT NULL, result_json LONGTEXT NULL,
      created_by INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    await db.query("INSERT IGNORE INTO customer_import_batches(request_key,payload_hash,created_by,result_json) VALUES ('__import_lock__','',0,'{}')");
    await db.query(`CREATE TABLE IF NOT EXISTS customer_payment_plans (
      invoice_id INT PRIMARY KEY, customer_id INT NOT NULL, version INT NOT NULL DEFAULT 0,
      updated_by INT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY customer_plan_customer(customer_id)
    ) ENGINE=InnoDB`);
    await db.query(`CREATE TABLE IF NOT EXISTS customer_payment_milestones (
      id INT AUTO_INCREMENT PRIMARY KEY, invoice_id INT NOT NULL, customer_id INT NOT NULL,
      title VARCHAR(120) NOT NULL, amount DECIMAL(12,2) NOT NULL, due_date DATE NULL,
      position INT NOT NULL, KEY milestone_invoice(invoice_id), KEY milestone_customer(customer_id)
    ) ENGINE=InnoDB`);
  })().catch(e => { ready.delete(db); throw e; }));
  return ready.get(db);
}
function phone(value) {
  const raw = String(value ?? '').trim();
  if (!/^[+\d\s()-]+$/.test(raw)) return '';
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15 ? digits.slice(-10) : '';
}
const cents = value => {
  if (value === '' || value === null || value === undefined || !/^\d+(\.\d{1,2})?$/.test(String(value))) return NaN;
  const n = Number(value);
  return Number.isFinite(n) && n <= 9999999999.99 ? Math.round(n * 100) : NaN;
};
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
const fields = { customer_name: 150, mobile_number: 20, alternate_number: 20, email: 150, address: 2000, city: 100, state: 100, pincode: 20, lead_source: 150, notes: 2000, solar_requirement: 20 };
function validateImport(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return 'Invalid customer row.';
  for (const [key, limit] of Object.entries(fields)) if (row[key] != null && (typeof row[key] === 'object' || String(row[key]).length > limit)) return `${key} is too long or invalid.`;
  if (!String(row.customer_name || '').trim()) return 'Customer name is required.';
  if (!phone(row.mobile_number)) return 'Use a valid mobile number (10–15 digits).';
  if (row.assigned_to != null && row.assigned_to !== '' && (!Number.isSafeInteger(Number(row.assigned_to)) || Number(row.assigned_to) <= 0)) return 'Assigned salesperson is invalid.';
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email).trim())) return 'Email address is invalid.';
  if (row.solar_requirement && !['Residential', 'Commercial', 'Industrial'].includes(row.solar_requirement)) return 'Customer type must be Residential, Commercial or Industrial.';
  const financialError=validateImportFinancials(row);
  if(financialError)return financialError;
  return null;
}
function validateImportFinancials(row){
  const amount=cents(row.invoice_amount || '0'),paid=cents(row.payment_amount || '0');
  if(!Number.isSafeInteger(amount)||!Number.isSafeInteger(paid))return 'Final amount and Payment received must be non-negative amounts with up to 2 decimal places.';
  if(paid>amount)return 'Payment received cannot exceed Final amount.';
  if(row.plant_size_kw!==undefined&&row.plant_size_kw!==null&&row.plant_size_kw!==''){
    if(!/^\d+(\.\d{1,3})?$/.test(String(row.plant_size_kw))||Number(row.plant_size_kw)<=0||Number(row.plant_size_kw)>9999999.999)return 'Plant size must be a positive kW value with up to 3 decimal places.';
  }
  return null;
}
async function accessibleCustomer(db, id, user) {
  const role = Number(user.role_id), params = [id];
  let scope = '';
  if (role === 2) {
    scope = ` AND ((l.is_deleted=0 AND l.assigned_to IN (SELECT id FROM users WHERE manager_id=? AND role_id=3 AND is_deleted=0)) OR (c.lead_id IS NULL AND c.assigned_to IN (SELECT id FROM users WHERE manager_id=? AND role_id=3 AND is_deleted=0)))`;
    params.push(user.id, user.id);
  } else if (role === 3) { scope = ' AND (c.assigned_to=? OR c.created_by=?)'; params.push(user.id, user.id); }
  else if (role !== 1 && user.portal_role !== 'finance') fail('Access denied.', 403);
  const [[customer]] = await db.query('SELECT c.id,c.lead_id FROM customers c LEFT JOIN leads l ON c.lead_id=l.id WHERE c.id=?' + scope, params);
  if (!customer) fail('Customer not found.', 404);
  return customer;
}
async function importCustomers(db, body, user) {
  if (![1, 2].includes(Number(user.role_id)) && user.portal_role !== "finance") fail('Customer import is available to Admins and Managers.', 403);
  if (!Array.isArray(body.rows) || !body.rows.length || body.rows.length > 100) fail('Import between 1 and 100 customer rows at a time.');
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(body.request_key || '')) fail('Import request ID is required.');
  await ensure(db);
  await require('./customerOpening').ensure(db);
  const hash = crypto.createHash('sha256').update(JSON.stringify(body.rows)).digest('hex');
  const c = await db.getConnection();
  try {
    await c.beginTransaction();
    await c.query("SELECT request_key FROM customer_import_batches WHERE request_key='__import_lock__' FOR UPDATE");
    const [[old]] = await c.query('SELECT * FROM customer_import_batches WHERE request_key=? FOR UPDATE', [body.request_key]);
    if (old) {
      if (old.payload_hash !== hash || Number(old.created_by) !== Number(user.id)) fail('This import ID was already used for different data.', 409);
      await c.commit(); return JSON.parse(old.result_json);
    }
    const result = { imported: 0, skipped: 0, errors: [], duplicates: [] }, seen = new Set();
    for (const [index, row] of body.rows.entries()) {
      const error = validateImport(row);
      if (error) { result.errors.push({ row: index + 2, message: error }); continue; }
      const mobile = phone(row.mobile_number);
      if (seen.has(mobile)) { result.skipped++; result.duplicates.push({ row: index + 2, message: 'Repeated mobile number in this file.' }); continue; }
      seen.add(mobile);
      const assigned = row.assigned_to ? Number(row.assigned_to) : null;
      if (Number(user.role_id) === 2 || assigned) {
        const [[representative]] = await c.query("SELECT id FROM users WHERE id=? AND role_id=3 AND is_deleted=0 AND LOWER(status)='active'" + (Number(user.role_id) === 2 ? ' AND manager_id=?' : ''), Number(user.role_id) === 2 ? [assigned, user.id] : [assigned]);
        if (!representative) { result.errors.push({ row: index + 2, message: 'Choose an active salesperson in your permitted team.' }); continue; }
      }
      const [[existing]] = await c.query("SELECT id FROM customers WHERE RIGHT(REGEXP_REPLACE(mobile_number,'[^0-9]',''),10)=? LIMIT 1 FOR UPDATE", [mobile]);
      if (existing) { result.skipped++; result.duplicates.push({ row: index + 2, message: 'Customer mobile number already exists; existing details were preserved.' }); continue; }
      const code = 'CUST-' + crypto.randomBytes(10).toString('hex').toUpperCase();
      const [inserted] = await c.query(`INSERT INTO customers(customer_code,customer_name,mobile_number,alternate_number,email,address,city,state,pincode,solar_requirement,lead_source,notes,assigned_to,created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [code, String(row.customer_name).trim(), mobile, row.alternate_number || null, row.email ? String(row.email).trim() : null, row.address || null, row.city || null, row.state || null, row.pincode || null, row.solar_requirement || 'Residential', row.lead_source ? String(row.lead_source).trim() : null, row.notes || null, assigned, user.id]);
      if(row.plant_size_kw || Number(row.invoice_amount)>0 || Number(row.payment_amount)>0){
        const rowHash=crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');
        const key=crypto.createHash('sha256').update(body.request_key+':'+index).digest('hex');
        await c.query(`INSERT INTO customer_opening_records(customer_id,request_key,payload_hash,plant_size_kw,invoice_amount,amount_paid,recorded_by) VALUES (?,?,?,?,?,?,?)`,[inserted.insertId,key,rowHash,row.plant_size_kw || null,cents(row.invoice_amount || '0')/100,cents(row.payment_amount || '0')/100,user.id]);
      }
      result.imported++;
    }
    await c.query('INSERT INTO customer_import_batches(request_key,payload_hash,result_json,created_by) VALUES (?,?,?,?)', [body.request_key, hash, JSON.stringify(result), user.id]);
    await c.commit(); return result;
  } catch (e) { await c.rollback(); throw e; } finally { c.release(); }
}
function allocateMilestones(rows, paid, today) {
  let remaining = Math.max(0, Math.round(Number(paid || 0) * 100));
  return rows.map(row => {
    const amount = Math.round(Number(row.amount) * 100), covered = Math.min(amount, remaining);
    remaining -= covered;
    const due = String(row.due_date || '').slice(0, 10);
    return { ...row, due_date: due || null, received_amount: covered / 100, balance_amount: (amount - covered) / 100, status: covered === amount ? 'Paid' : due && due < today ? 'Overdue' : covered ? 'Partially paid' : 'Pending' };
  });
}
async function invoiceForCustomer(db, customer, invoiceId, lock = false) {
  const [[invoice]] = await db.query('SELECT * FROM invoices WHERE id=? AND (customer_id=? OR (lead_id=? AND ? IS NOT NULL))' + (lock ? ' FOR UPDATE' : ''), [invoiceId, customer.id, customer.lead_id, customer.lead_id]);
  if (!invoice) fail('Linked invoice not found.', 404);
  return invoice;
}
function validatePlan(rows, payable) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 20) fail('Add between 1 and 20 payment milestones.');
  const normalized = rows.map((row, index) => {
    const value = cents(row.amount), title = String(row.title || '').trim();
    if (!title || title.length > 120 || !Number.isSafeInteger(value) || value <= 0) fail(`Milestone ${index + 1} needs a name and a positive amount with up to 2 decimal places.`);
    if (row.due_date && !validDate(row.due_date)) fail(`Milestone ${index + 1} has an invalid due date.`);
    return { title, amount: value / 100, due_date: row.due_date || null, position: index + 1 };
  });
  if (normalized.reduce((sum, row) => sum + Math.round(row.amount * 100), 0) > Math.round(Number(payable) * 100)) fail('Milestone total cannot exceed the invoice net payable amount.');
  return normalized;
}
async function savePlan(db, customerId, invoiceId, body, user) {
  if (![1, 2].includes(Number(user.role_id)) && user.portal_role !== "finance") fail('Only Admins and Managers can edit payment milestones.', 403);
  await ensure(db);
  const customer = await accessibleCustomer(db, customerId, user), c = await db.getConnection();
  try {
    await c.beginTransaction();
    const invoice = await invoiceForCustomer(c, customer, invoiceId, true);
    const rows = validatePlan(body.rows, invoice.net_payable_amount);
    const [[plan]] = await c.query('SELECT version FROM customer_payment_plans WHERE invoice_id=? FOR UPDATE', [invoiceId]);
    if (!Number.isInteger(body.version) || body.version !== Number(plan?.version || 0)) fail('Payment plan changed. Refresh before saving.', 409);
    await c.query('INSERT INTO customer_payment_plans(invoice_id,customer_id,version,updated_by) VALUES (?,?,1,?) ON DUPLICATE KEY UPDATE version=version+1,updated_by=VALUES(updated_by)', [invoiceId, customerId, user.id]);
    await c.query('DELETE FROM customer_payment_milestones WHERE invoice_id=?', [invoiceId]);
    for (const row of rows) await c.query('INSERT INTO customer_payment_milestones(invoice_id,customer_id,title,amount,due_date,position) VALUES (?,?,?,?,?,?)', [invoiceId, customerId, row.title, row.amount, row.due_date, row.position]);
    await c.commit(); return { version: body.version + 1 };
  } catch (e) { await c.rollback(); throw e; } finally { c.release(); }
}
module.exports = { validateImportFinancials, ensure, phone, cents, validDate, validateImport, accessibleCustomer, importCustomers, allocateMilestones, invoiceForCustomer, validatePlan, savePlan };
