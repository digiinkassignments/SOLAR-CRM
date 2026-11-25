const { PROJECT_STAGES } = require('./subsidyRules');

const safe = async (db, sql, args = [], fallback = []) => {
  try { const [rows] = await db.query(sql, args); return rows; } catch (error) {
    if (!['ER_NO_SUCH_TABLE','ER_BAD_FIELD_ERROR','ER_UNKNOWN_COLUMN'].includes(error.code)) throw error;
    return fallback;
  }
};

async function build(db, params = {}) {
  const now = new Date();
  const projects = await safe(db, `SELECT p.id,p.project_number,p.customer_name,p.stage,p.system_capacity_kw,
    p.created_at,p.updated_at,p.installation_start_date,p.completion_date,
    u.full_name AS owner_name FROM projects p LEFT JOIN users u ON u.id=p.assigned_to
    WHERE p.is_deleted=0 AND COALESCE(p.is_test,0)=0 ORDER BY p.updated_at ASC`, []);
  const stageTargets = Object.fromEntries(PROJECT_STAGES.map((stage, index) => [stage, index === 0 ? 3 : index < 4 ? 7 : 14]));
  const stageAgeing = projects.map((p) => {
    const entered = new Date(p.updated_at || p.created_at);
    const age = Math.max(0, Math.floor((now - entered) / 86400000));
    const target = stageTargets[p.stage] || 14;
    return { ...p, age_days: age, target_days: target, delayed: age > target };
  });
  const leads = await safe(db, `SELECT l.id,l.status,l.lead_source,l.required_kw,l.quotation_amount,l.created_at,
    l.assigned_to,u.full_name AS salesperson FROM leads l LEFT JOIN users u ON u.id=l.assigned_to
    WHERE l.is_deleted=0 AND COALESCE(l.is_test,0)=0`, []);
  const sourceMap = {};
  for (const l of leads) { const key = l.lead_source || 'Other'; const row = sourceMap[key] ||= { source:key, leads:0, won:0, lost:0, revenue:0 }; row.leads++; if (l.status === 'Won') { row.won++; row.revenue += Number(l.quotation_amount)||0; } if (['Lost','Invalid'].includes(l.status)) row.lost++; }
  const funnel = {}; for (const stage of ['New Lead','Contacted','Qualified','Site Survey Scheduled','Site Survey Done','Quotation Sent','Negotiation','Won','Lost']) funnel[stage] = leads.filter(l => l.status === stage).length;
  const engineers = await safe(db, `SELECT u.id,u.full_name,COUNT(DISTINCT p.id) active_projects,COALESCE(SUM(p.system_capacity_kw),0) capacity_kw
    FROM users u LEFT JOIN projects p ON p.assigned_to=u.id AND p.is_deleted=0 AND p.stage NOT IN ('Handover Done','Warranty Period')
    WHERE u.role_id=4 AND u.is_deleted=0 GROUP BY u.id,u.full_name ORDER BY active_projects DESC`, []);
  const logs = await safe(db, `SELECT created_by,COUNT(*) logs_count,COALESCE(SUM(hours_worked),0) hours_logged,MAX(log_date) last_log_date FROM installation_logs WHERE is_deleted=0 GROUP BY created_by`, []);
  const byEngineer = Object.fromEntries(logs.map(l => [l.created_by, l]));
  const engineerScorecard = engineers.map(e => ({ ...e, logs_count:Number(byEngineer[e.id]?.logs_count||0), hours_logged:Number(byEngineer[e.id]?.hours_logged||0), last_log_date:byEngineer[e.id]?.last_log_date||null, idle:Number(e.active_projects)>0 && !byEngineer[e.id] }));
  const subsidy = await safe(db, `SELECT portal_status,COUNT(*) count,COALESCE(SUM(expected_subsidy),0) pending_amount FROM subsidy_applications s JOIN projects p ON p.id=s.project_id AND p.is_deleted=0 WHERE COALESCE(p.subsidy_applicable,1)=1 GROUP BY portal_status`, []);
  const delayed = stageAgeing.filter(p => p.delayed).sort((a,b)=>b.age_days-a.age_days).slice(0,10);
  const insights = [];
  if (delayed.length) insights.push(`${delayed.length} project${delayed.length===1?' is':'s are'} beyond its stage target. Oldest is ${delayed[0].age_days} days (${delayed[0].owner_name || 'unassigned'}).`);
  const idle = engineerScorecard.filter(e => e.idle); if (idle.length) insights.push(`${idle.length} engineer${idle.length===1?' has':'s have'} active projects but no work log.`);
  const topSource = Object.values(sourceMap).sort((a,b)=>(b.won/(b.leads||1))-(a.won/(a.leads||1)))[0]; if (topSource) insights.push(`${topSource.source} currently has the strongest lead conversion at ${Math.round((topSource.won/(topSource.leads||1))*100)}%.`);
  return { generated_at: now.toISOString(), funnel, source_performance:Object.values(sourceMap).sort((a,b)=>b.leads-a.leads), stage_ageing:stageAgeing, delayed_projects:delayed, engineer_scorecard:engineerScorecard, subsidy_by_stage:subsidy, insights:insights.slice(0,5) };
}

module.exports = { build };
