const ready = new WeakMap();
const frequencies = ['Monthly', 'Quarterly', 'Half-yearly', 'Annual', 'On demand'];
async function ensure(db) {
  if (!ready.has(db)) ready.set(db, (async () => {
    await db.query(`CREATE TABLE IF NOT EXISTS company_amc_plans (
      id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(60) NOT NULL,
      coverage TEXT NOT NULL, exclusions TEXT NULL, annual_amount DECIMAL(10,2) NOT NULL,
      visit_frequency VARCHAR(30) NOT NULL, term_months INT NOT NULL DEFAULT 12,
      is_active TINYINT NOT NULL DEFAULT 1, version INT NOT NULL DEFAULT 1,
      created_by INT NOT NULL, updated_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  })().catch(error => { ready.delete(db); throw error; }));
  return ready.get(db);
}
function validate(body) {
  const text = (key, max, required = false) => {
    if (typeof body[key] !== 'string' || body[key].trim().length > max || (required && !body[key].trim())) throw Object.assign(new Error(`Enter a valid ${key.replaceAll('_', ' ')} (maximum ${max} characters).`), { status: 400 });
    return body[key].trim();
  };
  const name = text('name', 60, true), coverage = text('coverage', 4000, true), exclusions = text('exclusions', 4000);
  if (body.annual_amount === '' || body.annual_amount == null || !Number.isFinite(Number(body.annual_amount)) || Number(body.annual_amount) < 0 || Number(body.annual_amount) > 99999999.99) throw Object.assign(new Error('Enter a valid annual fee.'), { status: 400 });
  if (!frequencies.includes(body.visit_frequency)) throw Object.assign(new Error('Select a valid service frequency.'), { status: 400 });
  if (!Number.isInteger(Number(body.term_months)) || Number(body.term_months) < 1 || Number(body.term_months) > 120) throw Object.assign(new Error('Contract term must be 1–120 months.'), { status: 400 });
  if (typeof body.is_active !== 'boolean') throw Object.assign(new Error('Choose whether this plan is active.'), { status: 400 });
  return { name, coverage, exclusions, annual_amount: Math.round(Number(body.annual_amount) * 100) / 100, visit_frequency: body.visit_frequency, term_months: Number(body.term_months), is_active: body.is_active };
}
function parse(value) { if (!value) return null; return typeof value === 'string' ? JSON.parse(value) : value; }
async function warrantySelection(db, body, existing) {
  const data = { ...body, amc_plan_id: existing?.amc_plan_id || null, amc_plan_snapshot: parse(existing?.amc_plan_snapshot) };
  // Older clients may omit the new field: keep their saved contract snapshot intact.
  if (!Object.hasOwn(body, 'amc_plan_id')) {
    if (body.amc_plan && body.amc_plan !== existing?.amc_plan) throw Object.assign(new Error('Select an active company AMC plan.'), { status: 400 });
    return data;
  }
  if (body.amc_plan_id === '' || body.amc_plan_id === null) {
    if (existing?.amc_plan_id || body.amc_plan) throw Object.assign(new Error('Select an active company AMC plan, or keep the existing contract.'), { status: 400 });
    return data;
  }
  const id = Number(body.amc_plan_id);
  if (!Number.isSafeInteger(id) || id < 1) throw Object.assign(new Error('Select a valid AMC plan.'), { status: 400 });
  if (Number(existing?.amc_plan_id) === id && body.amc_apply_plan !== true) {
    data.amc_plan = existing.amc_plan;
    return data;
  }
  await ensure(db);
  const [rows] = await db.query('SELECT * FROM company_amc_plans WHERE id=? AND is_active=1', [id]);
  if (!rows[0]) throw Object.assign(new Error('This AMC plan is no longer active. Choose another plan.'), { status: 409 });
  const plan = rows[0];
  if (Number(body.amc_plan_version) !== Number(plan.version)) throw Object.assign(new Error('This plan changed. Reload plans and select it again.'), { status: 409 });
  data.amc_plan_id = id;
  data.amc_plan = plan.name;
  data.amc_plan_snapshot = { id, name: plan.name, coverage: plan.coverage, exclusions: plan.exclusions || '', annual_amount: Number(plan.annual_amount), visit_frequency: plan.visit_frequency, term_months: plan.term_months, version: plan.version };
  return data;
}
module.exports = { ensure, validate, warrantySelection, frequencies };
