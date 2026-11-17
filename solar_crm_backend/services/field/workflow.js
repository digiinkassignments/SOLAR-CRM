const managerScope = require('../../utils/managerScope');
const {
  definitions,
  validate,
  clean,
  validDate
} = require('./definitions');
const ready = new WeakSet();
async function ensure(db) {
  if (ready.has(db)) return;
  await db.query(`CREATE TABLE IF NOT EXISTS crm_field_tasks (id INT AUTO_INCREMENT PRIMARY KEY,resource_type VARCHAR(10) NOT NULL,resource_id INT NOT NULL,assigned_to INT NOT NULL,kind VARCHAR(30) NOT NULL,title VARCHAR(255) NOT NULL,priority VARCHAR(10) NOT NULL DEFAULT 'Medium',due_date DATE NOT NULL,due_time TIME NOT NULL,next_action TEXT NOT NULL,status VARCHAR(25) NOT NULL DEFAULT 'Open',note TEXT NULL,created_by INT NOT NULL,version INT NOT NULL DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX field_task_assignment(assigned_to,status,due_date),INDEX field_task_resource(resource_type,resource_id)) ENGINE=InnoDB`);
  await db.query(`CREATE TABLE IF NOT EXISTS crm_field_entries (id INT AUTO_INCREMENT PRIMARY KEY,resource_type VARCHAR(10) NOT NULL,resource_id INT NOT NULL,kind VARCHAR(30) NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'Draft',data_json LONGTEXT NOT NULL,created_by INT NOT NULL,request_key VARCHAR(80) NOT NULL,version INT NOT NULL DEFAULT 1,reviewed_by INT NULL,review_note TEXT NULL,legacy_log_id INT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,UNIQUE KEY field_entry_request(created_by,request_key),INDEX field_entry_resource(resource_type,resource_id)) ENGINE=InnoDB`);
  await db.query(`CREATE TABLE IF NOT EXISTS crm_field_files (id INT AUTO_INCREMENT PRIMARY KEY,entry_id INT NOT NULL,stored_name VARCHAR(100) NOT NULL,original_name VARCHAR(255) NOT NULL,mime VARCHAR(100) NOT NULL,size_bytes INT NOT NULL,uploaded_by INT NOT NULL,sha256 VARCHAR(64) NOT NULL,UNIQUE KEY field_file_hash(entry_id,sha256),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX field_file_entry(entry_id)) ENGINE=InnoDB`);
  await db.query(`CREATE TABLE IF NOT EXISTS crm_field_events (id INT AUTO_INCREMENT PRIMARY KEY,resource_type VARCHAR(10) NOT NULL,resource_id INT NOT NULL,event_type VARCHAR(50) NOT NULL,reference_id INT NULL,note TEXT NOT NULL,performed_by INT NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX field_event_resource(resource_type,resource_id)) ENGINE=InnoDB`);
  await db.query(`CREATE TABLE IF NOT EXISTS crm_field_serials (id INT AUTO_INCREMENT PRIMARY KEY,project_id INT NOT NULL,entry_id INT NOT NULL,component VARCHAR(20) NOT NULL,brand VARCHAR(100) NOT NULL,model VARCHAR(150) NULL,serial VARCHAR(150) NOT NULL,UNIQUE KEY installed_serial(component,brand,serial),INDEX field_serial_project(project_id)) ENGINE=InnoDB`);
  await require('../surveyBooking').ensure(db);
  await require('../../models/installationLogModel').ensureInstallationLogsTable(db);
  ready.add(db);
}
function scope(type, alias, user) {
  const id = Number(user.id);
  if (!Number.isSafeInteger(id) || id <= 0) return '1=0';
  const role = Number(user.role_id);
  if (role === 1) return '1=1';
  if (role === 2) return `${alias}.lead_id IN (SELECT ml.id FROM leads ml WHERE ${managerScope.leadFor(id, 'ml')})`;
  if (role === 4) return `(${alias}.${type === 'project' ? 'assigned_to' : 'assigned_engineer_id'}=${id} OR EXISTS (SELECT ft.id FROM crm_field_tasks ft WHERE ft.resource_type='${type}' AND ft.resource_id=${alias}.id AND ft.assigned_to=${id} AND ft.status<>'Cancelled'))`;
  return '1=0';
}
async function resource(db, type, id, user, lock = false) {
  if (!['project', 'survey'].includes(type)) return null;
  const project = type === 'project',
    alias = project ? 'p' : 's',
    table = project ? 'projects' : 'site_surveys';
  const cols = project ? 'p.id,p.project_number,p.project_uuid,p.lead_id,p.customer_name,p.customer_phone,p.customer_address,p.city,p.state,p.system_capacity_kw,p.panel_count,p.inverter_kw,p.stage,p.assigned_to,p.installation_start_date,p.installation_end_date' : 's.id,s.lead_id,s.assigned_engineer_id AS assigned_to,s.scheduled_date,s.scheduled_time,s.status,s.is_approved,s.approved_by,s.approved_at,s.project_id,p.project_number,s.roof_type,s.roof_area_sqft,s.shadow_conditions,s.electrical_phase,s.sanctioned_load_kw,s.proposed_capacity_kw,s.consumer_number,s.feasibility_verdict,s.feasibility_notes,s.site_notes,s.site_address,s.landmark,s.site_latitude,s.site_longitude,l.customer_name,l.mobile_number AS customer_phone,COALESCE(NULLIF(s.site_address,\'\'),l.address) AS customer_address,l.city,l.state,COALESCE(s.proposed_capacity_kw,l.required_kw) AS system_capacity_kw';
  const lookup = project ? '(p.id=? OR p.project_uuid=? OR p.project_number=?)' : 's.id=?';
  const [rows] = await db.query(`SELECT ${cols} FROM ${table} ${alias} ${project ? '' : 'JOIN leads l ON s.lead_id=l.id AND l.is_deleted=0 LEFT JOIN projects p ON (s.project_id=p.id OR (p.lead_id=s.lead_id AND p.is_deleted=0))'} WHERE ${lookup} ${project ? 'AND p.is_deleted=0' : ''} AND ${scope(type, alias, user)} LIMIT 1${lock ? ' FOR UPDATE' : ''}`, project ? [Number(id) || 0, String(id), String(id)] : [id]);
  return rows[0] || null;
}
async function event(db, type, id, kind, reference, note, user) {
  await db.query('INSERT INTO crm_field_events(resource_type,resource_id,event_type,reference_id,note,performed_by) VALUES (?,?,?,?,?,?)', [type, id, kind, reference, String(note).slice(0, 6000), user]);
}
async function getEntries(db, type, id, user = {}) {
  const visibility = Number(user.role_id) === 4 ? ` AND (e.created_by=${Number(user.id)} OR (e.status<>'Draft' AND (e.kind NOT IN ('design','documents') OR e.status='Approved')))` : '';
  const [rows] = await db.query(`SELECT e.*,u.full_name AS author_name,r.full_name AS reviewer_name FROM crm_field_entries e LEFT JOIN users u ON e.created_by=u.id LEFT JOIN users r ON e.reviewed_by=r.id WHERE e.resource_type=? AND e.resource_id=?${visibility} ORDER BY e.id DESC LIMIT 300`, [type, id]);
  let files = [];
  if (rows.length) [files] = await db.query('SELECT id,entry_id,original_name,mime,size_bytes,created_at FROM crm_field_files WHERE entry_id IN (?)', [rows.map(r => r.id)]);
  for (const row of rows) {
    row.data = JSON.parse(row.data_json);
    delete row.data_json;
    delete row.request_key;
    row.files = files.filter(f => Number(f.entry_id) === Number(row.id));
  }
  return rows;
}
function taskError(body) {
  if (typeof body.title !== 'string' || !String(body.title || '').trim() || String(body.title).length > 255) return 'Enter a task title (up to 255 characters).';
  if (!validDate(body.due_date) || !/^([01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(body.due_time || '')) return 'Set a real due date and exact time.';
  if (typeof body.next_action !== 'string' || !String(body.next_action || '').trim() || String(body.next_action).length > 6000) return 'Enter the next action.';
  if (!['Low', 'Medium', 'High', 'Urgent'].includes(body.priority)) return 'Choose a priority.';
  if (!['Survey', 'Installation', 'Quality', 'Service', 'AMC', 'Inspection', 'Documents'].includes(body.kind)) return 'Choose a task type.';
  return null;
}
function assignedLeadSQL(id){const user={id,role_id:4};return `SELECT s.lead_id FROM site_surveys s WHERE ${scope('survey','s',user)} UNION SELECT p.lead_id FROM projects p WHERE p.is_deleted=0 AND ${scope('project','p',user)}`;}
module.exports = {
  assignedLeadSQL,
  ensure,
  scope,
  resource,
  event,
  getEntries,
  taskError,
  definitions,
  validate,
  clean,
  validDate
};
