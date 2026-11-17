const booking=require('../services/surveyBooking');
const managerScope=require("../utils/managerScope");
const { db: defaultDb } = require("../config/db");

// Ensures site_surveys table exists automatically
const ensureSurveyTable = async (db = defaultDb) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS site_surveys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lead_id INT NOT NULL,
      assigned_engineer_id INT DEFAULT NULL,
      scheduled_date DATE NOT NULL,
      scheduled_time VARCHAR(20) NOT NULL,
      status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
      roof_type VARCHAR(50) DEFAULT 'RCC',
      roof_area_sqft DECIMAL(10, 2) DEFAULT NULL,
      shadow_conditions VARCHAR(100) DEFAULT NULL,
      electrical_phase VARCHAR(20) DEFAULT '1-Phase',
      sanctioned_load_kw DECIMAL(10, 2) DEFAULT NULL,
      photos JSON DEFAULT NULL,
      site_notes TEXT DEFAULT NULL,
      gps_latitude DECIMAL(10, 7) DEFAULT NULL,
      gps_longitude DECIMAL(10, 7) DEFAULT NULL,
      completed_at DATETIME DEFAULT NULL,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );
  `;
  try {
    await db.query(sql);
    await booking.ensure(db);
    try {
      await db.query(`ALTER TABLE leads MODIFY COLUMN status VARCHAR(100) NOT NULL DEFAULT 'New Lead'`);
    } catch (e) {}
    try {
      await db.query(`
        INSERT IGNORE INTO roles (id, role_name, description, status) 
        VALUES (4, 'Site Engineer', 'Conduct site surveys, feasibility checks & technical visits', 'Active')
      `);
    } catch (e) {}

    const addCol = async (table, colDef) => {
      try {
        await db.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
      } catch (err) {}
    };
    const modifyCol = async (table, colDef) => {
      try {
        await db.query(`ALTER TABLE ${table} MODIFY COLUMN ${colDef}`);
      } catch (err) {}
    };
    await addCol('site_surveys', 'consumer_number VARCHAR(50) NULL');
    await addCol('site_surveys', "feasibility_verdict VARCHAR(100) DEFAULT 'Feasible'");
    await addCol('site_surveys', 'not_feasible_reason TEXT NULL');
    await addCol('site_surveys', 'lead_action_on_not_feasible VARCHAR(100) NULL');
    await addCol('site_surveys', 'feasibility_notes TEXT NULL');
    await addCol('site_surveys', "roof_orientation VARCHAR(100) DEFAULT 'South'");
    await addCol('site_surveys', 'roof_tilt_angle DECIMAL(5,2) NULL');
    await addCol('site_surveys', "roof_ownership VARCHAR(150) DEFAULT 'Self-Owned'");
    await addCol('site_surveys', "noc_status VARCHAR(100) DEFAULT 'NOC Not Required'");
    await addCol('site_surveys', 'proposed_capacity_kw DECIMAL(8,2) NULL');
    await addCol('site_surveys', 'is_approved TINYINT(1) DEFAULT 0');
    await addCol('site_surveys', 'approved_by INT NULL');
    await addCol('site_surveys', 'approved_at DATETIME NULL');
    await addCol('site_surveys', 'project_id INT NULL');
    await addCol('leads', 'consumer_number VARCHAR(50) NULL');

    await modifyCol('site_surveys', 'shadow_conditions TEXT NULL');
    await modifyCol('site_surveys', 'roof_type VARCHAR(100) NULL');
    await modifyCol('site_surveys', 'electrical_phase VARCHAR(50) NULL');
    await modifyCol('site_surveys', 'roof_orientation VARCHAR(100) NULL');
    await modifyCol('site_surveys', 'roof_ownership VARCHAR(150) NULL');
    await modifyCol('site_surveys', 'noc_status VARCHAR(100) NULL');
    await modifyCol('site_surveys', 'feasibility_verdict VARCHAR(100) NULL');
    await modifyCol('site_surveys', 'not_feasible_reason TEXT NULL');
    await modifyCol('site_surveys', 'lead_action_on_not_feasible VARCHAR(100) NULL');
    await modifyCol('site_surveys', 'gps_latitude DECIMAL(12,8) NULL');
    await modifyCol('site_surveys', 'gps_longitude DECIMAL(12,8) NULL');
    await modifyCol('site_surveys', 'site_latitude DECIMAL(12,8) NULL');
    await modifyCol('site_surveys', 'site_longitude DECIMAL(12,8) NULL');
  } catch (err) {
    console.error("ensureSurveyTable error:", err);
  }
};

// Auto-run ensure table
ensureSurveyTable().catch(() => {});

// 1. Schedule Site Survey
const scheduleSurvey = async (data, createdBy, db = defaultDb) => {
  await ensureSurveyTable(db);
  const {
    lead_id,
    assigned_engineer_id,
    scheduled_date,
    scheduled_time,
    site_notes,
  } = data;

  await booking.ensure(db);
  const place = booking.location(data), exactTime = booking.time(scheduled_time);
  if (!exactTime) booking.fail('Enter an exact survey time.');
  const c = await db.getConnection();
  let surveyId;
  try {
    await c.beginTransaction();
    await booking.lockEngineer(c, assigned_engineer_id);
    const [lead] = await c.query('SELECT id FROM leads WHERE id=? AND is_deleted=0 FOR UPDATE', [lead_id]);
    if (!lead.length) booking.fail('Lead not found.', 404);
    const [existing] = await c.query("SELECT id,status FROM site_surveys WHERE lead_id=? AND status<>'cancelled' LIMIT 1 FOR UPDATE", [lead_id]);
    if (existing[0]?.status === 'completed') booking.fail('Survey already completed. Create a follow-up field task instead.', 409);
    surveyId = existing[0]?.id || 0;
    await booking.available(c, assigned_engineer_id, scheduled_date, exactTime, surveyId);
    const values = [assigned_engineer_id, scheduled_date, exactTime, site_notes || null, place.site_address, place.landmark, place.site_latitude, place.site_longitude, createdBy || null];
    if (surveyId) await c.query("UPDATE site_surveys SET assigned_engineer_id=?,scheduled_date=?,scheduled_time=?,site_notes=?,site_address=?,landmark=?,site_latitude=?,site_longitude=?,created_by=?,status='scheduled' WHERE id=?", [...values,surveyId]);
    else { const [result] = await c.query("INSERT INTO site_surveys (assigned_engineer_id,scheduled_date,scheduled_time,site_notes,site_address,landmark,site_latitude,site_longitude,created_by,lead_id,status) VALUES (?,?,?,?,?,?,?,?,?,?,'scheduled')", [...values,lead_id]); surveyId=result.insertId; }
    await c.query("UPDATE leads SET status='Site Survey Scheduled',site_visit_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", [scheduled_date,lead_id]);
    await c.commit();
  } catch (e) { await c.rollback(); throw e; } finally { c.release(); }

  // Log activity
  try {
    let engineerName = "Unassigned";
    if (assigned_engineer_id) {
      const [u] = await db.query(`SELECT full_name FROM users WHERE id = ? LIMIT 1`, [assigned_engineer_id]);
      if (u.length > 0) engineerName = u[0].full_name || "Assigned Engineer";
    }
    await db.query(
      `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark) VALUES (?, 'Site Visit Scheduled', ?, ?)`,
      [
        lead_id,
        `Scheduled for ${scheduled_date} ${scheduled_time}`,
        `Assigned to: ${engineerName}. Notes: ${site_notes || "N/A"}`,
      ]
    );
  } catch (err) {
    console.error("Failed to log survey activity:", err);
  }

  return getSurveyById(surveyId, db);
};

// 2. Get Survey by ID
const getSurveyById = async (id, db = defaultDb, skipEnsure = false) => {
  if (!skipEnsure) await ensureSurveyTable(db);
  const [rows] = await db.query(
    `
    SELECT s.*, 
           l.lead_code, l.customer_name, l.mobile_number, l.address, l.city, l.state, l.required_kw,
           u.full_name AS engineer_name, u.email AS engineer_email, u.phone AS engineer_phone,
           p.id AS project_id, p.project_number, p.stage AS project_stage, p.assigned_to AS project_assigned_to
    FROM site_surveys s
    LEFT JOIN leads l ON s.lead_id = l.id
    LEFT JOIN users u ON s.assigned_engineer_id = u.id
    LEFT JOIN projects p ON (s.project_id = p.id OR (p.lead_id = s.lead_id AND p.is_deleted = 0))
    WHERE s.id = ?
    LIMIT 1
    `,
    [id]
  );
  if (rows.length === 0) return null;
  const survey = rows[0];
  if (typeof survey.photos === "string") {
    try { survey.photos = JSON.parse(survey.photos); } catch (e) { survey.photos = []; }
  }
  return survey;
};

// 3. Get Survey by Lead ID
const getSurveyByLeadId = async (leadId, db = defaultDb) => {
  await ensureSurveyTable(db);
  const [rows] = await db.query(
    `
    SELECT s.*, 
           l.lead_code, l.customer_name, l.mobile_number, l.address, l.city, l.state, l.required_kw,
           u.full_name AS engineer_name, u.email AS engineer_email, u.phone AS engineer_phone,
           p.id AS project_id, p.project_number, p.stage AS project_stage, p.assigned_to AS project_assigned_to
    FROM site_surveys s
    LEFT JOIN leads l ON s.lead_id = l.id
    LEFT JOIN users u ON s.assigned_engineer_id = u.id
    LEFT JOIN projects p ON (s.project_id = p.id OR (p.lead_id = s.lead_id AND p.is_deleted = 0))
    WHERE s.lead_id = ?
    ORDER BY s.id DESC
    LIMIT 1
    `,
    [leadId]
  );
  if (rows.length === 0) return null;
  const survey = rows[0];
  if (typeof survey.photos === "string") {
    try { survey.photos = JSON.parse(survey.photos); } catch (e) { survey.photos = []; }
  }
  return survey;
};

// 4. Complete Survey Execution
const saveSurveyData = async (id, data, db) => {
  const {
    roof_type,
    roof_area_sqft,
    shadow_conditions,
    electrical_phase,
    sanctioned_load_kw,
    photos,
    site_notes,
    gps_latitude,
    gps_longitude,
    consumer_number,
    feasibility_verdict,
    not_feasible_reason,
    lead_action_on_not_feasible,
    feasibility_notes,
    roof_orientation,
    roof_tilt_angle,
    roof_ownership,
    noc_status,
    proposed_capacity_kw,
  } = data;

  const parseNum = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const safeRoofArea = parseNum(roof_area_sqft);
  const safeLoadKw = parseNum(sanctioned_load_kw);
  const safeProposedKw = parseNum(proposed_capacity_kw);
  const safeTilt = parseNum(roof_tilt_angle);
  const safeLat = parseNum(gps_latitude);
  const safeLng = parseNum(gps_longitude);

  const photosJson = Array.isArray(photos) ? JSON.stringify(photos) : (typeof photos === "string" ? photos : null);
  const verdict = feasibility_verdict;
  if (!['Feasible', 'Feasible with conditions', 'Not feasible'].includes(verdict)) {
    throw Object.assign(new Error('Choose a feasibility verdict.'), { status: 400 });
  }

  await db.query(
    `
    UPDATE site_surveys SET
      roof_type = ?,
      roof_area_sqft = ?,
      shadow_conditions = ?,
      electrical_phase = ?,
      sanctioned_load_kw = ?,
      consumer_number = ?,
      feasibility_verdict = ?,
      not_feasible_reason = ?,
      lead_action_on_not_feasible = ?,
      feasibility_notes = ?,
      roof_orientation = ?,
      roof_tilt_angle = ?,
      roof_ownership = ?,
      noc_status = ?,
      proposed_capacity_kw = ?,
      photos = ?,
      site_notes = ?,
      gps_latitude = ?,
      gps_longitude = ?,
      status = 'completed',
      completed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [
      roof_type || "RCC",
      safeRoofArea,
      shadow_conditions || null,
      electrical_phase || "Single Phase",
      safeLoadKw,
      consumer_number ? String(consumer_number).trim() : null,
      verdict,
      not_feasible_reason || null,
      lead_action_on_not_feasible || null,
      feasibility_notes || null,
      roof_orientation || "South",
      safeTilt,
      roof_ownership || "Self-Owned",
      noc_status || "NOC Not Required",
      safeProposedKw,
      photosJson,
      site_notes || null,
      safeLat,
      safeLng,
      id,
    ]
  );

  const survey = await getSurveyById(id, db, true);
  if (survey && survey.lead_id) {
    if (consumer_number) {
      try {
        await db.query(`UPDATE leads SET consumer_number = ? WHERE id = ?`, [String(consumer_number).trim(), survey.lead_id]);
      } catch (e) {}
    }

    let targetStatus = 'Site Survey Done';
    let statusRemark = `Survey: ${verdict}. Roof: ${roof_type || "RCC"} (${safeRoofArea || 0} sqft) · Supply: ${electrical_phase || "Single Phase"}`;

    if (verdict === 'Not feasible') {
      const reasonText = not_feasible_reason || feasibility_notes || 'Technical constraints';
      if (lead_action_on_not_feasible === 'Switch Lead to On Hold') {
        targetStatus = 'On Hold';
        statusRemark = `Survey Not Feasible: ${reasonText}. Lead moved to On Hold.`;
      } else if (lead_action_on_not_feasible === 'Close Lead as Lost / Not Feasible') {
        targetStatus = 'Lost';
        statusRemark = `Survey Not Feasible: ${reasonText}. Lead closed.`;
      } else {
        targetStatus = 'Site Survey Done';
        statusRemark = `Survey Result: Not Feasible (${reasonText}).`;
      }
    }

    try {
      await db.query(
        `UPDATE leads SET status = ?, remark = CONCAT(COALESCE(remark, ''), '\n', ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [targetStatus, statusRemark, survey.lead_id]
      );
    } catch (err) {
      console.warn("Failed to update lead status from survey:", err.message);
    }

    try {
      await db.query(
        `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark) VALUES (?, 'Status Changed', ?, ?)`,
        [
          survey.lead_id,
          targetStatus,
          statusRemark,
        ]
      );
    } catch (err) {
      console.error("Failed to log survey completion:", err);
    }
  }

  return survey;
};

// Persist the report and its customer/project links atomically.
const completeSurvey = async (id, data, db = defaultDb, actorId = null) => {
  await ensureSurveyTable(db);
  await require('./projectModel').ensureProjectTables(db);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[reference]] = await connection.query('SELECT lead_id FROM site_surveys WHERE id=?', [id]);
    if (!reference) throw Object.assign(new Error('Survey not found.'), { status: 404 });
    await connection.query('SELECT id FROM leads WHERE id=? FOR UPDATE', [reference.lead_id]);
    const [[current]] = await connection.query('SELECT status FROM site_surveys WHERE id=? FOR UPDATE', [id]);
    if (current.status === 'cancelled') throw Object.assign(new Error('Cancelled surveys cannot be completed.'), { status: 409 });
    await saveSurveyData(id, data, connection);
    const conversion = await require('../services/surveyConversion').convertFeasibleSurvey(connection, id, actorId);
    const survey = await getSurveyById(id, connection, true);
    await connection.commit();
    return { ...survey, ...(conversion || {}) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
};

// 5. Get All Surveys List
const getSurveysList = async (queryParams = {}, db = defaultDb) => {
  await ensureSurveyTable(db);
  const { status, engineer_id, search } = queryParams;
  let whereClauses = ["l.is_deleted=0"+managerScope.lead(db,"l")];
  if (queryParams.is_engineer && queryParams.scope_user_id) {
    whereClauses.push(`(s.assigned_engineer_id = ${Number(queryParams.scope_user_id)} OR s.created_by = ${Number(queryParams.scope_user_id)})`);
  } else if (queryParams.scope_user_id) {
    const uid = Number(queryParams.scope_user_id);
    whereClauses.push(`(l.assigned_to = ${uid} OR l.created_by = ${uid} OR s.created_by = ${uid} OR s.assigned_engineer_id = ${uid})`);
  }
  let params = [];

  if (status) {
    whereClauses.push(`s.status = ?`);
    params.push(status);
  }

  if (engineer_id) {
    whereClauses.push(`s.assigned_engineer_id = ?`);
    params.push(engineer_id);
  }

  if (search) {
    whereClauses.push(`(l.customer_name LIKE ? OR l.lead_code LIKE ? OR l.mobile_number LIKE ?)`);
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const [rows] = await db.query(
    `
    SELECT s.*, 
           l.lead_code, l.customer_name, l.mobile_number, l.address, l.city, l.state, l.required_kw,
           u.full_name AS engineer_name,
           p.id AS project_id, p.project_number, p.stage AS project_stage
    FROM site_surveys s
    LEFT JOIN leads l ON s.lead_id = l.id
    LEFT JOIN users u ON s.assigned_engineer_id = u.id
    LEFT JOIN projects p ON (s.project_id = p.id OR (p.lead_id = s.lead_id AND p.is_deleted = 0))
    ${whereSql}
    ORDER BY s.scheduled_date DESC, s.id DESC
    `,
    params
  );

  return rows.map((r) => {
    if (typeof r.photos === "string") {
      try { r.photos = JSON.parse(r.photos); } catch (e) { r.photos = []; }
    }
    return r;
  });
};

// 6. Approve Survey and Convert / Create Project
const approveSurveyAndCreateProject = async ({ surveyId, leadId, approvedBy }, db = defaultDb) => {
  await ensureSurveyTable(db);
  const survey = surveyId ? await getSurveyById(surveyId, db) : await getSurveyByLeadId(leadId, db);
  if (!survey || survey.status !== 'completed' || survey.feasibility_verdict !== 'Feasible') {
    throw Object.assign(new Error('Only a completed Feasible survey can create a project. Save the feasibility report first.'), { status: 400 });
  }
  await require('./projectModel').ensureProjectTables(db);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await require('../services/surveyConversion').convertFeasibleSurvey(connection, survey.id, approvedBy);
    await connection.commit();
    return { ...result, lead_id: survey.lead_id, stage: survey.project_stage || 'Pre-Install Inspection', assigned_to: survey.assigned_engineer_id, customer_name: survey.customer_name };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};

module.exports = {
  ensureSurveyTable,
  scheduleSurvey,
  getSurveyById,
  getSurveyByLeadId,
  completeSurvey,
  getSurveysList,
  approveSurveyAndCreateProject,
};
