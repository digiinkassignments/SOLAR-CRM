const ensured = new WeakSet();
const managerScope = require('../utils/managerScope');

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
  const ymd = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const end = ymd(now);
  if (period === 'last_month') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: ymd(first), to: ymd(last) };
  }
  if (period === 'financial_year') {
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return { from: `${year}-04-01`, to: end };
  }
  if (period === 'month' || period === 'this_month') return { from: ymd(new Date(now.getFullYear(),now.getMonth(),1)), to:end };
  if (period === 'quarter' || period === 'this_quarter') return { from: ymd(new Date(now.getFullYear(),Math.floor(now.getMonth()/3)*3,1)), to:end };
  if (period === 'year' || period === 'this_year') return { from: `${now.getFullYear()}-01-01`, to:end };
  const days = { today: 1, '7d': 7, '30d': 30 }[period];
  if (!days) return null;
  const start = new Date(now); start.setDate(start.getDate() - days + 1);
  return { from: ymd(start), to: end };
}

async function overview(db, params = {}) {
  await ensure(db);
  const range = dateRange(params.period, params.from, params.to);
  const date = (field) => range ? `${field} >= ? AND ${field} < DATE_ADD(?, INTERVAL 1 DAY)` : '1=1';
  const args = range ? [range.from, range.to] : [];
  const [leadRows] = await db.query(`SELECT COUNT(*) total,
    SUM(status='Won') won, SUM(status='Lost') lost, COALESCE(SUM(CASE WHEN status='Won' THEN quotation_amount ELSE 0 END),0) revenue
    FROM leads l WHERE l.is_deleted=0 AND COALESCE(l.is_test,0)=0${managerScope.lead(db,'l')} AND ${date('l.created_at')}`, args);
  const [projectRows] = await db.query(`SELECT COUNT(*) total, COALESCE(SUM(system_capacity_kw),0) capacity,
    SUM(stage='Handover Done') handed_over FROM projects p WHERE p.is_deleted=0 AND COALESCE(p.is_test,0)=0${managerScope.linked(db,'p.lead_id')} AND ${date('p.created_at')}`, args);
  const [invoiceRows] = await db.query(`SELECT COALESCE(SUM(gross_total),0) invoiced,
    COALESCE(SUM(amount_paid),0) collected, COALESCE(SUM(GREATEST(COALESCE(balance_due,0),0)),0) outstanding
    FROM invoices i WHERE COALESCE(i.is_test,0)=0${managerScope.linked(db,'i.lead_id')} AND ${date('i.created_at')}`, args);
  let previous = null;
  if (range) {
    const start = new Date(`${range.from}T00:00:00Z`), end = new Date(`${range.to}T00:00:00Z`);
    const span = Math.max(1, Math.round((end - start) / 86400000) + 1);
    const previousEnd = new Date(start); previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
    const previousStart = new Date(previousEnd); previousStart.setUTCDate(previousStart.getUTCDate() - span + 1);
    const previousArgs = [previousStart.toISOString().slice(0,10), previousEnd.toISOString().slice(0,10)];
    const [[pl]] = await db.query(`SELECT COUNT(*) total, COALESCE(SUM(CASE WHEN l.status='Won' THEN l.quotation_amount ELSE 0 END),0) revenue FROM leads l WHERE l.is_deleted=0 AND COALESCE(l.is_test,0)=0${managerScope.lead(db,'l')} AND l.created_at>=? AND l.created_at<DATE_ADD(?,INTERVAL 1 DAY)`, previousArgs);
    const [[pp]] = await db.query(`SELECT COUNT(*) total FROM projects p WHERE p.is_deleted=0 AND COALESCE(p.is_test,0)=0${managerScope.linked(db,'p.lead_id')} AND p.created_at>=? AND p.created_at<DATE_ADD(?,INTERVAL 1 DAY)`, previousArgs);
    const [[pi]] = await db.query(`SELECT COALESCE(SUM(i.gross_total),0) invoiced,COALESCE(SUM(i.amount_paid),0) collected FROM invoices i WHERE COALESCE(i.is_test,0)=0${managerScope.linked(db,'i.lead_id')} AND i.created_at>=? AND i.created_at<DATE_ADD(?,INTERVAL 1 DAY)`, previousArgs);
    previous = { range:{from:previousArgs[0],to:previousArgs[1]}, leads:Number(pl.total||0), revenueWon:Number(pl.revenue||0), activeProjects:Number(pp.total||0), invoiced:Number(pi.invoiced||0), collected:Number(pi.collected||0) };
  }
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
  }, previous, dataHealth: Object.fromEntries(Object.entries(health).map(([k,v])=>[k,Number(v||0)])) };
}

module.exports = { ensure, overview, dateRange };
