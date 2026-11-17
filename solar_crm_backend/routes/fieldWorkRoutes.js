const booking=require('../services/surveyBooking');
const router = require('express').Router(),
  crypto = require('crypto'),
  path = require('path'),
  fs = require('fs/promises'),
  multer = require('multer');
const {
  verifyToken
} = require('../middleware/authMiddleware');
const w = require('../services/field/workflow');
const sales = require('../services/salesWorkflow');
const privateRoot = path.resolve(__dirname, '../private/field');
const wrap = fn => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if(!error.status || error.status>=500)console.error('Field workflow error details:', error.sqlMessage || error.message, 'SQL:', error.sql, error.stack);
    res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : (error.sqlMessage || 'Field work could not be saved or loaded. Please retry.')
    });
  }
};
const fail = (message, status = 400) => {
  const error = Error(message);
  error.status = status;
  throw error;
};
router.use(verifyToken, (req, res, next) => {
  if (![1, 2, 4].includes(Number(req.user.role_id))) return res.sendStatus(403);
  if (req.clientInfo?.id && req.user?.client_id && Number(req.user.client_id) !== Number(req.clientInfo.id)) return res.status(403).json({
    success: false,
    message: 'Sign out and sign in to this company again.'
  });
  next();
});
router.use(async (req, res, next) => {
  try {
    await w.ensure(req.db);
    next();
  } catch {
    res.status(503).json({
      success: false,
      message: 'Field workspace unavailable.'
    });
  }
});
const find = async (req, type = req.params.type, id = req.params.id, db = req.db, lock = false) => {
  const row = await w.resource(db, type, id, req.user, lock);
  if (!row) fail('Assigned work not found.', 404);
  return row;
};
async function entry(req, db = req.db, lock = false) {
  const [rows] = await db.query(`SELECT * FROM crm_field_entries WHERE id=?${lock ? ' FOR UPDATE' : ''}`, [req.params.entryId]);
  if (!rows[0]) fail('Record not found.', 404);
  const e = rows[0];
  await find(req, e.resource_type, e.resource_id, db, lock);
  return e;
}
router.get('/workspace', wrap(async (req, res) => {
  const prefs = await sales.preferences(req.db),
    clock = sales.localClock(prefs.timezone);
  const search = String(req.query.search || '').slice(0, 150);
  const page = Math.max(1, parseInt(req.query.page) || 1),
    limit = 100,
    term = '%' + search + '%';
  const projectWhere = `p.is_deleted=0 AND ${w.scope('project', 'p', req.user)} AND (p.customer_name LIKE ? OR p.project_number LIKE ?)`;
  let surveyWhere = `l.is_deleted=0 AND ${w.scope('survey', 's', req.user)} AND (l.customer_name LIKE ? OR l.lead_code LIKE ?)`;
  const surveyParams = [term, term];
  if (req.query.survey_filter === 'today') {
    surveyWhere += ' AND s.scheduled_date=?';
    surveyParams.push(clock.date);
  } else if (req.query.survey_filter === 'overdue') {
    surveyWhere += " AND s.status='scheduled' AND s.scheduled_date<?";
    surveyParams.push(clock.date);
  } else if (['scheduled', 'completed'].includes(req.query.survey_filter)) {
    surveyWhere += ' AND s.status=?';
    surveyParams.push(req.query.survey_filter);
  }
  const taskScope = Number(req.user.role_id) === 4 ? `(t.assigned_to=${Number(req.user.id)} AND ((t.resource_type='project' AND p.is_deleted=0) OR (t.resource_type='survey' AND s.lead_id IN (SELECT id FROM leads WHERE is_deleted=0))))` : `((t.resource_type='project' AND p.is_deleted=0 AND ${w.scope('project', 'p', req.user)}) OR (t.resource_type='survey' AND ${w.scope('survey', 's', req.user)}))`;
  const [[pc], [sc], [projects], [surveys], [tasks]] = await Promise.all([
    req.db.query(`SELECT COUNT(*) AS total FROM projects p WHERE ${projectWhere}`, [term, term]),
    req.db.query(`SELECT COUNT(*) AS total FROM site_surveys s JOIN leads l ON s.lead_id=l.id WHERE ${surveyWhere}`, surveyParams),
    req.db.query(`SELECT p.id,p.project_number,p.customer_name,p.customer_phone,p.customer_address,p.city,p.stage,p.system_capacity_kw,p.assigned_to,u.full_name AS engineer_name FROM projects p LEFT JOIN users u ON p.assigned_to=u.id WHERE ${projectWhere} ORDER BY p.id DESC LIMIT ? OFFSET ?`, [term, term, limit, (page - 1) * limit]),
    req.db.query(`SELECT s.id,s.lead_id,s.assigned_engineer_id,s.scheduled_date,s.scheduled_time,s.status,s.is_approved,s.project_id,s.feasibility_verdict,p.project_number,l.customer_name,l.mobile_number AS customer_phone,COALESCE(NULLIF(s.site_address,''),l.address) AS customer_address,s.landmark,s.site_latitude,s.site_longitude,l.city,l.lead_code FROM site_surveys s JOIN leads l ON s.lead_id=l.id LEFT JOIN projects p ON (s.project_id=p.id OR (p.lead_id=s.lead_id AND p.is_deleted=0)) WHERE ${surveyWhere} ORDER BY s.scheduled_date DESC,s.id DESC LIMIT ? OFFSET ?`, [...surveyParams, limit, (page - 1) * limit]),
    req.db.query(`SELECT t.*,u.full_name AS engineer_name,COALESCE(p.customer_name,l.customer_name) AS customer_name FROM crm_field_tasks t LEFT JOIN projects p ON t.resource_type='project' AND t.resource_id=p.id LEFT JOIN site_surveys s ON t.resource_type='survey' AND t.resource_id=s.id LEFT JOIN leads l ON s.lead_id=l.id LEFT JOIN users u ON t.assigned_to=u.id WHERE ${taskScope} ORDER BY CASE WHEN t.status IN ('Open','In progress','Blocked') THEN 0 WHEN t.status='Submitted' THEN 1 ELSE 2 END,t.due_date,t.due_time LIMIT 300`)
  ]);
  const [stats] = await req.db.query(`SELECT COUNT(*) AS assigned_surveys,SUM(s.status='scheduled' AND s.scheduled_date=?) AS today_surveys,SUM(s.status='completed') AS completed_surveys FROM site_surveys s JOIN leads l ON s.lead_id=l.id AND l.is_deleted=0 WHERE ${w.scope('survey', 's', req.user)}`, [clock.date]);
  const [[taskStats]] = await req.db.query(`SELECT SUM(t.status IN ('Open','In progress','Blocked')) AS open_tasks,SUM(t.status='Blocked') AS blocked_tasks,SUM(t.status='Submitted') AS awaiting_review,SUM(t.status IN ('Open','In progress','Blocked') AND (t.due_date<'${clock.date}' OR (t.due_date='${clock.date}' AND t.due_time<'${clock.time}'))) AS overdue_tasks FROM crm_field_tasks t LEFT JOIN projects p ON t.resource_type='project' AND t.resource_id=p.id LEFT JOIN site_surveys s ON t.resource_type='survey' AND t.resource_id=s.id WHERE ${taskScope}`);
  const [todaySurveys] = await req.db.query(`SELECT s.id,s.lead_id,s.scheduled_date,s.scheduled_time,s.status,s.is_approved,s.project_id,s.feasibility_verdict,p.project_number,l.customer_name,l.mobile_number AS customer_phone,COALESCE(NULLIF(s.site_address,''),l.address) AS customer_address,s.landmark,s.site_latitude,s.site_longitude,l.city,l.lead_code FROM site_surveys s JOIN leads l ON s.lead_id=l.id AND l.is_deleted=0 LEFT JOIN projects p ON (s.project_id=p.id OR (p.lead_id=s.lead_id AND p.is_deleted=0)) WHERE ${w.scope('survey', 's', req.user)} AND s.scheduled_date=? AND s.status='scheduled' ORDER BY s.scheduled_time LIMIT 50`, [clock.date]);
  const entryScope = `((e.resource_type='project' AND p.is_deleted=0 AND ${w.scope('project', 'p', req.user)}) OR (e.resource_type='survey' AND s.lead_id IN (SELECT id FROM leads WHERE is_deleted=0) AND ${w.scope('survey', 's', req.user)}))${Number(req.user.role_id) === 4 ? ' AND e.created_by=' + Number(req.user.id) : ''}`;
  const [[reviewStats]] = await req.db.query(`SELECT COUNT(*) AS total FROM crm_field_entries e LEFT JOIN projects p ON e.resource_type='project' AND e.resource_id=p.id LEFT JOIN site_surveys s ON e.resource_type='survey' AND e.resource_id=s.id WHERE e.status='Submitted' AND ${entryScope}`);
  const [pendingEntries] = await req.db.query(`SELECT e.id,e.kind,e.resource_type,e.resource_id,e.status,e.created_at,COALESCE(p.customer_name,l.customer_name) AS customer_name,COALESCE(s.proposed_capacity_kw, l.required_kw) AS proposed_capacity_kw,s.feasibility_verdict,u.full_name AS author_name FROM crm_field_entries e LEFT JOIN projects p ON e.resource_type='project' AND e.resource_id=p.id LEFT JOIN site_surveys s ON e.resource_type='survey' AND e.resource_id=s.id LEFT JOIN leads l ON s.lead_id=l.id LEFT JOIN users u ON e.created_by=u.id WHERE e.status='Submitted' AND ${entryScope} ORDER BY e.id LIMIT 50`);
  res.json({
    success: true,
    data: {
      pending_entries: pendingEntries,
      pending_review_count: reviewStats.total,
      today_surveys: todaySurveys,
      local_time: clock.time,
      task_stats: taskStats,
      definitions: w.definitions,
      timezone: prefs.timezone,
      local_date: clock.date,
      page,
      limit,
      total_projects: pc[0].total,
      total_surveys: sc[0].total,
      projects,
      surveys,
      tasks,
      stats: stats[0]
    }
  });
}));
router.get('/engineers', wrap(async (req, res) => {
  const [rows] = await req.db.query("SELECT id,full_name FROM users WHERE role_id=4 AND is_deleted=0 AND LOWER(status)='active' ORDER BY full_name");
  res.json({
    success: true,
    data: rows
  });
}));
router.get('/catalog', wrap(async (req, res) => {
  const [rows] = await req.db.query('SELECT id,item_code,name,brand,model,unit,available_stock FROM stock_items WHERE is_active=1 ORDER BY name LIMIT 500');
  res.json({
    success: true,
    data: rows
  });
}));
router.get('/check-consumer-number', wrap(async (req, res) => {
  const number = String(req.query.consumer_number || '').trim();
  const currentLeadId = Number(req.query.lead_id) || 0;
  if (!number) return res.json({ success: true, exists: false });

  const [leads] = await req.db.query(
    "SELECT id, lead_code, customer_name, status FROM leads WHERE consumer_number = ? AND is_deleted = 0 AND id <> ? LIMIT 1",
    [number, currentLeadId]
  );
  if (leads && leads.length > 0) {
    return res.json({
      success: true,
      exists: true,
      source: 'lead',
      record: leads[0],
      message: `Consumer number is already assigned to Lead ${leads[0].lead_code || '#' + leads[0].id} (${leads[0].customer_name} - ${leads[0].status})`
    });
  }

  const [surveys] = await req.db.query(
    "SELECT s.id, s.lead_id, s.feasibility_verdict, l.customer_name FROM site_surveys s LEFT JOIN leads l ON s.lead_id = l.id WHERE s.consumer_number = ? AND s.lead_id <> ? LIMIT 1",
    [number, currentLeadId]
  );
  if (surveys && surveys.length > 0) {
    return res.json({
      success: true,
      exists: true,
      source: 'survey',
      record: surveys[0],
      message: `Consumer number is already used in Site Survey #${surveys[0].id} (${surveys[0].customer_name || 'Lead #' + surveys[0].lead_id})`
    });
  }

  res.json({ success: true, exists: false });
}));
router.get('/resources/:type/:id', wrap(async (req, res) => {
  const resource = await find(req);
  const type = req.params.type;
  const [entries, tasks, events, serials] = await Promise.all([w.getEntries(req.db, type, resource.id, req.user), req.db.query(`SELECT t.*,u.full_name AS engineer_name FROM crm_field_tasks t LEFT JOIN users u ON t.assigned_to=u.id WHERE resource_type=? AND resource_id=? ${Number(req.user.role_id) === 4 ? 'AND t.assigned_to=' + Number(req.user.id) : ''} ORDER BY due_date,due_time`, [type, resource.id]), req.db.query('SELECT e.*,u.full_name AS author_name FROM crm_field_events e LEFT JOIN users u ON e.performed_by=u.id WHERE resource_type=? AND resource_id=? ORDER BY e.id DESC LIMIT 200', [type, resource.id]), type === 'project' ? req.db.query('SELECT component,brand,model,serial,entry_id FROM crm_field_serials WHERE project_id=?', [resource.id]) : [[]]]);
  res.json({
    success: true,
    data: {
      resource,
      definitions: w.definitions,
      entries,
      tasks: tasks[0],
      events: events[0],
      serials: serials[0]
    }
  });
}));
router.post('/resources/:type/:id/assignment', wrap(async (req, res) => {
  if (Number(req.user.role_id) === 4) fail('Coordinator access required.', 403);
  const row = await find(req);
  const [[engineer]] = await req.db.query("SELECT id FROM users WHERE id=? AND role_id=4 AND is_deleted=0 AND status='Active'", [req.body.engineer_id]);
  if (!engineer) fail('Choose an active Site Engineer.');
  if (!String(req.body.note || '').trim()) fail('Enter an assignment reason.');
  const c = await req.db.getConnection();
  try {
    await c.beginTransaction();
    if(req.params.type==='survey')await booking.lockEngineer(c,engineer.id);
    const current = await find(req, req.params.type, row.id, c, true);
    if(req.params.type==='survey') {
      if(current.status!=='scheduled')fail('Only scheduled surveys can be reassigned.',409);
      await booking.available(c,engineer.id,String(current.scheduled_date).slice(0,10),current.scheduled_time,row.id);
    }
    await c.query(`UPDATE ${req.params.type === 'project' ? 'projects' : 'site_surveys'} SET ${req.params.type === 'project' ? 'assigned_to' : 'assigned_engineer_id'}=? WHERE id=?`, [engineer.id, row.id]);
    await w.event(c, req.params.type, row.id, 'Engineer assigned', null, `Engineer #${engineer.id}: ${req.body.note}`, req.user.id);
    await c.commit();
    res.json({
      success: true,
      message: 'Engineer assignment saved.'
    });
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}));
router.post('/resources/:type/:id/tasks', wrap(async (req, res) => {
  if (Number(req.user.role_id) === 4) fail('Coordinator access required.', 403);
  const r = await find(req),
    b = req.body;
  const error = w.taskError(b);
  if (error) fail(error);
  if(!(req.params.type==='survey'?['Survey']:['Installation','Quality','Service','AMC','Inspection','Documents']).includes(b.kind))fail('Choose a task type that matches this assignment.');
  const [[engineer]] = await req.db.query("SELECT id FROM users WHERE id=? AND role_id=4 AND is_deleted=0 AND status='Active'", [b.assigned_to]);
  if (!engineer) fail('Choose an active Site Engineer.');
  const c = await req.db.getConnection();
  try {
    await c.beginTransaction();
    await find(req, req.params.type, r.id, c, true);
    const [result] = await c.query('INSERT INTO crm_field_tasks(resource_type,resource_id,assigned_to,kind,title,priority,due_date,due_time,next_action,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)', [req.params.type, r.id, engineer.id, b.kind, b.title.trim(), b.priority, b.due_date, b.due_time, b.next_action.trim(), req.user.id]);
    await w.event(c, req.params.type, r.id, 'Task assigned', result.insertId, b.title, req.user.id);
    await c.commit();
    res.json({
      success: true,
      message: 'Task assigned.',
      data: {
        id: result.insertId
      }
    });
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}));
router.patch('/tasks/:taskId', wrap(async (req, res) => {
  const c = await req.db.getConnection();
  try {
    await c.beginTransaction();
    const [[t]] = await c.query('SELECT * FROM crm_field_tasks WHERE id=? FOR UPDATE', [req.params.taskId]);
    if (!t) fail('Task not found.', 404);
    await find(req, t.resource_type, t.resource_id, c);
    const engineer = Number(req.user.role_id) === 4;
    if (engineer && Number(t.assigned_to) !== Number(req.user.id)) fail('Task not assigned to you.', 404);
    const b = req.body;
    if (Number(b.version) !== Number(t.version)) fail('Task changed. Refresh before saving.', 409);
    const statuses = engineer ? ['In progress', 'Blocked', 'Submitted'] : ['Open', 'In progress', 'Blocked', 'Submitted', 'Completed', 'Cancelled'];
    if (!statuses.includes(b.status)) fail('Invalid task status.');
    if (engineer && ['Completed', 'Cancelled'].includes(t.status)) fail('Coordinator closed this task.', 409);
    if (!String(b.note || '').trim() || !String(b.next_action || '').trim()) fail('Add an outcome/blocker note and next action.');
    if (b.status === 'Submitted') {
      const kinds = {
        Survey: ['survey'],
        Installation: ['work_log', 'installation'],
        Quality: ['quality'],
        Service: ['service'],
        AMC: ['service'],
        Inspection: ['quality'],
        Documents: ['documents']
      };
      const [[proof]] = await c.query("SELECT COUNT(*) AS total FROM crm_field_entries WHERE resource_type=? AND resource_id=? AND created_by=? AND kind IN (?) AND created_at>=? AND status IN ('Submitted','Approved')", [t.resource_type, t.resource_id, t.assigned_to, kinds[t.kind] || [], t.created_at]);
      if (!proof.total) fail('Submit a field record with evidence before submitting the task.');
    }
    if (b.status === 'Completed') {
      const [[proof]] = await c.query("SELECT COUNT(*) AS total FROM crm_field_entries WHERE resource_type=? AND resource_id=? AND created_by=? AND kind IN (?) AND status='Approved' AND created_at>=?", [t.resource_type, t.resource_id, t.assigned_to, {
        Survey: ['survey'],
        Installation: ['work_log', 'installation'],
        Quality: ['quality'],
        Service: ['service'],
        AMC: ['service'],
        Inspection: ['quality'],
        Documents: ['documents']
      }[t.kind] || [], t.created_at]);
      if (!proof.total) fail('Approve the submitted work evidence before closing this task.');
    }
    if (!w.validDate(b.due_date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.due_time || '')) fail('Enter a real due date and exact time.');
    await c.query('UPDATE crm_field_tasks SET status=?,note=?,next_action=?,due_date=?,due_time=?,version=version+1 WHERE id=?', [b.status, String(b.note).slice(0, 6000), String(b.next_action).slice(0, 6000), b.due_date, b.due_time, t.id]);
    await w.event(c, t.resource_type, t.resource_id, 'Task ' + b.status, t.id, b.note, req.user.id);
    await c.commit();
    res.json({
      success: true,
      message: engineer && b.status === 'Submitted' ? 'Work submitted for coordinator review.' : 'Task updated.'
    });
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}));
router.post('/resources/:type/:id/reschedule', wrap(async (req, res) => {
  if (req.params.type !== 'survey') fail('Use task dates for project visits.');
  const row = await find(req),
    b = req.body;
  if (row.status !== 'scheduled') fail('Only a scheduled survey can be rescheduled. Ask the coordinator for a new visit assignment.', 409);
  if (!w.validDate(b.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time || '') || !String(b.reason || '').trim()) fail('Enter date, exact time and rescheduling reason.');
  if (!['Unconfirmed', 'Confirmed', 'Customer unavailable'].includes(b.confirmation)) fail('Select customer confirmation.');
  const c = await req.db.getConnection();
  try {
    await c.beginTransaction();
    await booking.lockEngineer(c,row.assigned_to);
    const current = await find(req, 'survey', row.id, c, true);
    if(Number(current.assigned_to)!==Number(row.assigned_to))fail('Survey assignment changed. Refresh and try again.',409);
    await booking.available(c,current.assigned_to,b.date,b.time,row.id);
    if (current.status !== 'scheduled') fail('Survey is no longer scheduled.', 409);
    await c.query("UPDATE site_surveys SET scheduled_date=?,scheduled_time=?,status='scheduled' WHERE id=?", [b.date, b.time, row.id]);
    await w.event(c, 'survey', row.id, 'Visit rescheduled', null, `${String(current.scheduled_date).slice(0, 10)} ${current.scheduled_time} -> ${b.date} ${b.time}; ${b.confirmation}; ${String(b.reason).slice(0, 4000)}`, req.user.id);
    await c.commit();
    res.json({
      success: true,
      message: 'Visit rescheduled. Customer notification is not sent automatically.'
    });
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}));
router.post('/resources/:type/:id/entries', wrap(async (req, res) => {
  const r = await find(req),
    b = req.body,
    def = Object.hasOwn(w.definitions, b.kind) ? w.definitions[b.kind] : null;
  if (!def || def.resource !== req.params.type) fail('Choose a valid record type for this assignment.');
  const error = w.validate(b.kind, b.data, false);
  if (error) fail(error);
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(b.request_key || '')) fail('Record request ID required.');
  const [old] = await req.db.query('SELECT id,resource_type,resource_id,kind,version FROM crm_field_entries WHERE created_by=? AND request_key=?', [req.user.id, b.request_key]);
  if (old[0]) {
    if (old[0].resource_type !== req.params.type || Number(old[0].resource_id) !== Number(r.id) || old[0].kind !== b.kind) fail('Request ID reused for different work.', 409);
    return res.json({
      success: true,
      data: {
        id: old[0].id,
        version: old[0].version
      },
      message: 'Existing draft recovered.'
    });
  }
  const [result] = await req.db.query('INSERT INTO crm_field_entries(resource_type,resource_id,kind,data_json,created_by,request_key) VALUES (?,?,?,?,?,?)', [req.params.type, r.id, b.kind, JSON.stringify(w.clean(b.kind, b.data)), req.user.id, b.request_key]);
  res.status(201).json({
    success: true,
    data: {
      id: result.insertId
    },
    message: 'Draft saved. Attach evidence and submit for review.'
  });
}));
router.put('/entries/:entryId', wrap(async (req, res) => {
  const c = await req.db.getConnection();
  try {
    await c.beginTransaction();
    const e = await entry(req, c, true);
    if (Number(e.created_by) !== Number(req.user.id) || e.status !== 'Draft') fail('Only your own draft can be edited.', 409);
    if (Number(req.body.version) !== Number(e.version)) fail('Record changed. Refresh before saving.', 409);
    const error = w.validate(e.kind, req.body.data, false);
    if (error) fail(error);
    await c.query('UPDATE crm_field_entries SET data_json=?,version=version+1 WHERE id=?', [JSON.stringify(w.clean(e.kind, req.body.data)), e.id]);
    await c.commit();
    res.json({
      success: true,
      message: 'Draft updated.'
    });
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}));
router.post('/entries/:entryId/submit', wrap(async (req, res) => {
  const c = await req.db.getConnection();
  try {
    await c.beginTransaction();
    const e = await entry(req, c, true);
    if (Number(e.created_by) !== Number(req.user.id)) fail('Only the author can submit.', 403);
    if (e.status === 'Submitted' || e.status === 'Approved') {
      await c.rollback();
      return res.json({
        success: true,
        message: 'Already submitted.'
      });
    }
    if (e.status !== 'Draft') fail('Create a new revision to address a returned record.', 409);
    if (Number(req.body.version) !== Number(e.version)) fail('Record changed. Refresh before submitting.', 409);
    const d = JSON.parse(e.data_json),
      error = w.validate(e.kind, d, true);
    if (error) fail(error);
    const prefs = await sales.preferences(req.db);
    const today = sales.localClock(prefs.timezone).date;
    for (const key of ['log_date', 'visit_date', 'handover_date']) if (d[key] && d[key] > today) fail('Actual work/visit dates cannot be in the future.');
    const [[files]] = await c.query('SELECT COUNT(*) AS total FROM crm_field_files WHERE entry_id=?', [e.id]);
    if (w.definitions[e.kind].evidence && !files.total) fail('Attach supporting photo/PDF evidence before submission.');
    if (e.kind === 'serials') {
      for (const row of d.rows) await c.query('INSERT INTO crm_field_serials(project_id,entry_id,component,brand,model,serial) VALUES (?,?,?,?,?,?)', [e.resource_id, e.id, row.component, row.brand.slice(0, 100), row.model.slice(0, 150), row.serial.slice(0, 150)]);
    }
    if (e.kind === 'survey') {
      const current = await find(req, 'survey', e.resource_id, c, true);
      if (current.status === 'cancelled') fail('This survey was cancelled. Ask your coordinator for a new assignment.', 409);

      const roofCondNotes = [d.roof_condition, d.access_notes].filter(Boolean).join('\n');
      const lat = d.gps_latitude ? Number(Number(d.gps_latitude).toFixed(7)) : null;
      const lng = d.gps_longitude ? Number(Number(d.gps_longitude).toFixed(7)) : null;
      await c.query(
        `UPDATE site_surveys SET 
          roof_type=?, roof_area_sqft=?, shadow_conditions=?, electrical_phase=?, sanctioned_load_kw=?,
          site_notes=?, gps_latitude=?, gps_longitude=?, consumer_number=?, proposed_capacity_kw=?,
          feasibility_verdict=?, not_feasible_reason=?, lead_action_on_not_feasible=?, feasibility_notes=?,
          roof_orientation=?, roof_tilt_angle=?, roof_ownership=?, noc_status=?,
          status='completed', completed_at=NOW() 
        WHERE id=?`,
        [
          d.roof_type || null,
          d.roof_area_sqft || null,
          d.shading || null,
          d.electrical_phase || null,
          d.sanctioned_load_kw || null,
          roofCondNotes,
          lat,
          lng,
          d.consumer_number || null,
          d.proposed_capacity_kw || null,
          d.feasibility_verdict || 'Feasible',
          d.not_feasible_reason || null,
          d.lead_action_on_not_feasible || null,
          d.feasibility_notes || d.not_feasible_reason || null,
          d.roof_orientation || 'South',
          d.roof_tilt_angle || null,
          d.roof_ownership || 'Self-Owned',
          d.noc_status || 'NOC Not Required',
          e.resource_id
        ]
      );

      // Update lead consumer_number
      if (d.consumer_number) {
        await c.query(`UPDATE leads SET consumer_number=? WHERE id=?`, [d.consumer_number, current.lead_id]);
      }

      // Handle lead status based on feasibility verdict
      if (d.feasibility_verdict === 'Not feasible') {
        let newLeadStatus = 'Site Survey Done';
        if (d.lead_action_on_not_feasible === 'Switch Lead to On Hold') {
          newLeadStatus = 'On Hold';
        } else if (d.lead_action_on_not_feasible === 'Close Lead as Lost / Not Feasible') {
          newLeadStatus = 'Lost';
        }
        await c.query(`UPDATE leads SET status=? WHERE id=?`, [newLeadStatus, current.lead_id]);

        try {
          await c.query(
            `INSERT INTO lead_activities (lead_id, user_id, activity_type, activity_title, activity_description, created_at)
             VALUES (?, ?, 'site_survey', 'Site Feasibility: Not Feasible', ?, NOW())`,
            [
              current.lead_id,
              req.user.id,
              `Site marked Not Feasible by Engineer. Reason: ${d.not_feasible_reason || 'Technical constraints'}. Lead moved to ${newLeadStatus}.`
            ]
          );
        } catch (_) {}
      } else {
        await c.query(
          "UPDATE leads SET status='Site Survey Done' WHERE id=? AND status IN ('Site Survey Scheduled','Site Visit Scheduled','New','Contacted','Qualified')",
          [current.lead_id]
        );
      }
    }
    if (e.kind === 'work_log') {
      const [result] = await c.query('INSERT INTO installation_logs(project_id,log_date,phase,work_done,workers_count,hours_worked,crew_names,materials_used,issues_faced,progress_percent,safety_checklist,weather,supervisor_signoff,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL,0,?)', [e.resource_id, d.log_date, d.phase.slice(0, 80), d.work_done, d.workers_count, d.hours_worked, d.crew || null, d.materials_used || null, d.issues || null, d.progress_percent, JSON.stringify(d.checks), req.user.id]);
      await c.query('UPDATE crm_field_entries SET legacy_log_id=? WHERE id=?', [result.insertId, e.id]);
    }
    await c.query("UPDATE crm_field_entries SET status='Submitted',version=version+1 WHERE id=?", [e.id]);
    await w.event(c, e.resource_type, e.resource_id, 'Record submitted', e.id, w.definitions[e.kind].label, req.user.id);
    await c.commit();
    res.json({
      success: true,
      message: 'Work submitted. Coordinator review is separate from completion and utility approval.'
    });
  } catch (e) {
    await c.rollback();
    if (e.code === 'ER_DUP_ENTRY') fail('A hardware serial is already registered. Check the serial register.', 409);
    throw e;
  } finally {
    c.release();
  }
}));
router.post('/entries/:entryId/review', wrap(async (req, res) => {
  if (Number(req.user.role_id) === 4) fail('Coordinator review required.', 403);
  const c = await req.db.getConnection();
  try {
    await c.beginTransaction();
    const e = await entry(req, c, true),
      b = req.body;
    if (e.status !== 'Submitted' || Number(b.version) !== Number(e.version)) fail('Record changed or already reviewed.', 409);
    
    // Normalize decision: Approved vs Returned (Decline)
    let decision = String(b.decision || '').trim();
    if (/^(approve|approved)$/i.test(decision)) decision = 'Approved';
    else if (/^(decline|declined|return|returned|reject|rejected)$/i.test(decision)) decision = 'Returned';
    else fail('Decision must be Approved or Returned/Declined.');

    const note = String(b.note || (decision === 'Approved' ? 'Site survey verified & approved' : '')).trim();
    if (decision === 'Returned' && !note) fail('Please provide a reason for declining or returning the record.');
    if (Number(e.created_by) === Number(req.user.id)) fail('Ask another coordinator to review your own submission.', 403);

    await c.query('UPDATE crm_field_entries SET status=?,reviewed_by=?,review_note=?,version=version+1 WHERE id=?', [decision, req.user.id, note.slice(0, 6000), e.id]);
    if (e.kind === 'serials' && decision === 'Returned') await c.query('DELETE FROM crm_field_serials WHERE entry_id=?', [e.id]);
    if (e.legacy_log_id && decision === 'Approved') await c.query('UPDATE installation_logs SET supervisor_signoff=1,supervisor_signoff_time=NOW() WHERE id=?', [e.legacy_log_id]);
    await w.event(c, e.resource_type, e.resource_id, 'Record ' + decision, e.id, note, req.user.id);
    await c.commit();

    let projectCreatedInfo = null;
    if (e.resource_type === 'survey') {
      if (decision === 'Approved') {
        try {
          const surveyModel = require('../models/surveyModel');
          const [surveys] = await req.db.query("SELECT assigned_engineer_id FROM site_surveys WHERE id = ? LIMIT 1", [e.resource_id]);
          const targetEngineerId = surveys[0]?.assigned_engineer_id || null;

          projectCreatedInfo = await surveyModel.approveSurveyAndCreateProject({
            surveyId: e.resource_id,
            approvedBy: req.user.id,
            notes: note,
            assignedTo: targetEngineerId,
          }, req.db);
        } catch (pErr) {
          console.error('Could not auto-create project from field survey approval:', pErr.message);
        }
      } else {
        // Declined / Returned
        try {
          await req.db.query("UPDATE site_surveys SET is_approved = 0 WHERE id = ?", [e.resource_id]);
        } catch (_) {}
      }
    }

    res.json({
      success: true,
      message: decision === 'Approved'
        ? (projectCreatedInfo
            ? `Survey approved! Project ${projectCreatedInfo.project_number} created and assigned to Site Engineer.`
            : 'Survey approved.')
        : 'Survey record declined and returned to Site Engineer for revision.',
      project: projectCreatedInfo,
    });
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1
  }
}).single('file');
const activeUploads=new Map();
router.post('/entries/:entryId/files', async (req, res) => {
  try{const draft=await entry(req);if(Number(draft.created_by)!==Number(req.user.id)||draft.status!=='Draft')fail('Evidence can only be attached to your draft.',409);}catch(error){return res.status(error.status||500).json({success:false,message:error.status?error.message:'Upload access check unavailable.'});}
  const uploadKey=`${req.clientInfo?.id||'default'}:${req.user.id}`;
  if((activeUploads.get(uploadKey)||0)>=2)return res.status(429).json({success:false,message:'Wait for your current uploads before retrying.'});
  activeUploads.set(uploadKey,(activeUploads.get(uploadKey)||0)+1);let released=false;const releaseUpload=()=>{if(released)return;released=true;const count=(activeUploads.get(uploadKey)||1)-1;if(count)activeUploads.set(uploadKey,count);else activeUploads.delete(uploadKey);};res.once('finish',releaseUpload);res.once('close',releaseUpload);
  upload(req, res, async error => {
    if (error) return res.status(400).json({
      success: false,
      message: 'Use one JPG, PNG, WEBP or PDF file up to 8 MB.'
    });
    try {
      if (!req.file) fail('Choose a file.');
      const b = req.file.buffer;
      const ext = b.subarray(0, 5).toString() === '%PDF-' ? 'pdf' : b[0] === 255 && b[1] === 216 ? 'jpg' : b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'png' : b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' ? 'webp' : null;
      if (!ext) fail('Unsupported file content.');
      const c = await req.db.getConnection();
      let stored,committing=false;
      try {
        await c.beginTransaction();
        const e = await entry(req, c, true);
        if (Number(e.created_by) !== Number(req.user.id) || e.status !== 'Draft') fail('Evidence can only be attached to your draft.', 409);
        const digest = crypto.createHash('sha256').update(b).digest('hex');
        const [[existing]] = await c.query('SELECT id FROM crm_field_files WHERE entry_id=? AND sha256=?', [e.id, digest]);
        if (existing) {
          await c.rollback();
          return res.json({
            success: true,
            message: 'Evidence already uploaded.'
          });
        }
        const [[count]] = await c.query('SELECT COUNT(*) AS total FROM crm_field_files WHERE entry_id=?', [e.id]);
        if (count.total >= 20) fail('Maximum 20 files per field record.');
        await fs.mkdir(privateRoot, {
          recursive: true
        });
        stored = crypto.randomBytes(24).toString('hex') + '.' + ext;
        await fs.writeFile(path.join(privateRoot, stored), b, {
          flag: 'wx'
        });
        await c.query('INSERT INTO crm_field_files(entry_id,stored_name,original_name,mime,size_bytes,uploaded_by,sha256) VALUES (?,?,?,?,?,?,?)', [e.id, stored, path.basename(req.file.originalname).replace(/[\r\n]/g, '').slice(0, 255), ext === 'pdf' ? 'application/pdf' : 'image/' + (ext === 'jpg' ? 'jpeg' : ext), b.length, req.user.id, digest]);
        committing=true;
        await c.commit();
        res.json({
          success: true,
          message: 'Private evidence uploaded.'
        });
      } catch (err) {
        await c.rollback();
        if (stored&&!committing) await fs.unlink(path.join(privateRoot, stored)).catch(() => {});
        throw err;
      } finally {
        c.release();
      }
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        message: err.status ? err.message : 'Upload failed. Your draft is saved; retry the upload.'
      });
    }
  });
});
router.get('/files/:fileId', wrap(async (req, res) => {
  const [[file]] = await req.db.query('SELECT f.*,e.resource_type,e.resource_id,e.kind,e.status AS entry_status,e.created_by AS entry_author FROM crm_field_files f JOIN crm_field_entries e ON f.entry_id=e.id WHERE f.id=?', [req.params.fileId]);
  if (!file) fail('File not found.', 404);
  await find(req, file.resource_type, file.resource_id);
  if (Number(req.user.role_id) === 4 && Number(file.entry_author) !== Number(req.user.id) && (file.entry_status === 'Draft' || ['design', 'documents'].includes(file.kind) && file.entry_status !== 'Approved')) fail('File not available before review.', 404);
  if (!/^[a-f0-9]{48}\.(pdf|jpg|png|webp)$/.test(file.stored_name)) fail('File unavailable.', 404);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'private, no-store');
  res.download(path.join(privateRoot, file.stored_name), file.original_name);
}));
module.exports = router;
