const ensured = new WeakSet();

async function ensure(db) {
  if (ensured.has(db)) return;
  const columns = [
    ['leads', 'is_test'], ['customers', 'is_test'], ['projects', 'is_test'], ['invoices', 'is_test'],
  ];
  for (const [table, column] of columns) {
    try { await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} TINYINT(1) NOT NULL DEFAULT 0`); }
    catch (err) { if (!['ER_DUP_FIELDNAME','ER_DUP_COLUMN','ER_NO_SUCH_TABLE'].includes(err.code)) throw err; }
  }
  ensured.add(db);
}

function dateRange(period, from, to) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) return { from, to };
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const days = { today: 1, '7d': 7, '30d': 30, month: now.getDate(), quarter: 90, year: 365 }[period];
  if (!days) return null;
  const start = new Date(now); start.setDate(start.getDate() - days + 1);
  return { from: start.toISOString().slice(0, 10), to: end };
}

async function overview(db, params = {}) {
  await ensure(db);
  const range = dateRange(params.period, params.from, params.to);
  const args = [];
  const date = (field) => range ? `${field} >= ? AND ${field} < DATE_ADD(?, INTERVAL 1 DAY)` : '1=1';
  if (range) args.push(range.from, range.to);
  const [leadRows] = await db.query(`SELECT COUNT(*) total,
    SUM(status='Won') won, SUM(status='Lost') lost, COALESCE(SUM(CASE WHEN status='Won' THEN quotation_amount ELSE 0 END),0) revenue
    FROM leads WHERE is_deleted=0 AND COALESCE(is_test,0)=0 AND ${date('created_at')}`, args);
  const [projectRows] = await db.query(`SELECT COUNT(*) total, COALESCE(SUM(system_capacity_kw),0) capacity,
    SUM(stage='Handover Done') handed_over FROM projects WHERE is_deleted=0 AND COALESCE(is_test,0)=0`);
  const [invoiceRows] = await db.query(`SELECT COALESCE(SUM(gross_total),0) invoiced,
    COALESCE(SUM(amount_paid),0) collected, COALESCE(SUM(GREATEST(COALESCE(balance_due,0),0)),0) outstanding
    FROM invoices WHERE COALESCE(is_test,0)=0`);
  const [[health]] = await db.query(`SELECT
    (SELECT COUNT(*) FROM projects WHERE is_deleted=0 AND COALESCE(is_test,0)=0 AND installation_start_date > CURRENT_DATE()) future_project_dates,
    (SELECT COUNT(*) FROM invoices WHERE COALESCE(is_test,0)=0 AND (due_date IS NULL OR due_date='0000-00-00')) invoices_without_due_date,
    (SELECT COUNT(*) FROM invoices WHERE COALESCE(is_test,0)=0 AND COALESCE(amount_paid,0)>COALESCE(gross_total,0)) overpaid_invoices,
    (SELECT COUNT(*) FROM projects WHERE is_deleted=0 AND COALESCE(is_test,0)=0 AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)) stale_projects`);
  const lead = leadRows[0] || {}, project = projectRows[0] || {}, invoice = invoiceRows[0] || {};
  return { range, asOf: new Date().toISOString(), kpis: {
    leads: Number(lead.total||0), won: Number(lead.won||0), lost: Number(lead.lost||0),
    conversion: Number(lead.total||0) ? Number(((Number(lead.won||0)/Number(lead.total))*100).toFixed(1)) : 0,
    revenueWon: Number(lead.revenue||0), activeProjects: Number(project.total||0),
    installedKw: Number(project.capacity||0), handedOver: Number(project.handed_over||0),
    invoiced: Number(invoice.invoiced||0), collected: Number(invoice.collected||0), outstanding: Number(invoice.outstanding||0),
  }, dataHealth: Object.fromEntries(Object.entries(health).map(([k,v])=>[k,Number(v||0)])) };
}

module.exports = { ensure, overview, dateRange };
