const crypto = require('crypto');

// Caller owns the transaction. Lock the lead first so concurrent submissions
// for the same lead cannot create two customers or two projects.
async function convertFeasibleSurvey(db, surveyId, actorId) {
  const [[reference]] = await db.query('SELECT lead_id FROM site_surveys WHERE id=?', [surveyId]);
  if (!reference) throw Object.assign(new Error('Survey not found.'), { status: 404 });
  const [[lead]] = await db.query('SELECT * FROM leads WHERE id=? AND is_deleted=0 FOR UPDATE', [reference.lead_id]);
  if (!lead) throw Object.assign(new Error('Lead not found.'), { status: 404 });
  const [[survey]] = await db.query('SELECT * FROM site_surveys WHERE id=? FOR UPDATE', [surveyId]);
  if (survey.status !== 'completed' || survey.feasibility_verdict !== 'Feasible') return null;

  const [[customer]] = await db.query('SELECT id FROM customers WHERE id=? OR lead_id=? ORDER BY id LIMIT 1 FOR UPDATE', [lead.customer_id || 0, lead.id]);
  let customerId = customer?.id;
  if (!customerId) {
    const [result] = await db.query(`INSERT INTO customers
      (customer_code,lead_id,customer_name,mobile_number,email,address,city,state,pincode,solar_requirement,assigned_to,created_by,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      `CUST-${crypto.randomBytes(10).toString('hex').toUpperCase()}`, lead.id, lead.customer_name,
      lead.mobile_number || '', lead.email || null, survey.site_address || lead.address || null,
      lead.city || null, lead.state || null, lead.pincode || null,
      ['Residential', 'Commercial', 'Industrial'].includes(lead.solar_requirement) ? lead.solar_requirement : 'Residential',
      lead.assigned_to || null, actorId || null, 'Created automatically from a feasible site survey.'
    ]);
    customerId = result.insertId;
  }
  await db.query('UPDATE leads SET customer_id=? WHERE id=?', [customerId, lead.id]);
  const [[existing]] = await db.query('SELECT id,project_number FROM projects WHERE lead_id=? AND is_deleted=0 ORDER BY id LIMIT 1 FOR UPDATE', [lead.id]);
  let project = existing;
  if (!project) {
    const capacity = Number(survey.proposed_capacity_kw || lead.required_kw);
    if (!Number.isFinite(capacity) || capacity <= 0) throw Object.assign(new Error('Enter a positive proposed system capacity before marking the survey Feasible.'), { status: 400 });
    const code = crypto.randomBytes(8).toString('hex').toUpperCase();
    const projectNumber = `PROJ-${new Date().getFullYear()}-${code}`;
    const [result] = await db.query(`INSERT INTO projects
      (project_number,project_uuid,lead_id,customer_id,customer_name,customer_phone,customer_address,city,state,pincode,system_capacity_kw,stage,stage_updated_at,assigned_to,assigned_by,notes,created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,'Pre-Install Inspection',NOW(),?,?,?,?)`, [
      projectNumber, `PRJ-${code}`, lead.id, customerId, lead.customer_name, lead.mobile_number || '',
      survey.site_address || lead.address || null, lead.city || null, lead.state || null, lead.pincode || null,
      capacity, survey.assigned_engineer_id || null, actorId || null,
      survey.feasibility_notes || survey.site_notes || 'Created automatically from a feasible site survey.', actorId || null
    ]);
    project = { id: result.insertId, project_number: projectNumber };
    await db.query(`INSERT INTO project_stage_logs (project_id,from_stage,to_stage,changed_by,notes)
      VALUES (?,NULL,'Pre-Install Inspection',?,'Automatically created from feasible site survey')`, [project.id, actorId || null]);
    await db.query(`INSERT INTO lead_activity_logs (lead_id,action_type,new_value,remark)
      VALUES (?,'Feasible Survey Converted',?,'Customer and project linked automatically; no approval required.')`, [lead.id, projectNumber]);
  } else {
    await db.query('UPDATE projects SET customer_id=? WHERE id=?', [customerId, project.id]);
  }
  // Retain legacy fields for older screens; this is automatic acceptance,
  // not a manager approval or a claim that the sales deal has been won.
  await db.query('UPDATE site_surveys SET project_id=?,is_approved=1,approved_by=NULL,approved_at=NOW() WHERE id=?', [project.id, surveyId]);
  return { customer_id: customerId, project_id: project.id, project_number: project.project_number };
}
module.exports = { convertFeasibleSurvey };
