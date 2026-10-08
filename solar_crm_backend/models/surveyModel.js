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
    try {
      await db.query(`ALTER TABLE leads MODIFY COLUMN status VARCHAR(100) NOT NULL DEFAULT 'New Lead'`);
    } catch (e) {}
    try {
      await db.query(`ALTER TABLE lead_activity_logs MODIFY COLUMN action_type VARCHAR(100) NOT NULL DEFAULT 'Status Changed'`);
    } catch (e) {}
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

  // Check if a survey already exists for this lead
  const [existing] = await db.query(
    `SELECT id FROM site_surveys WHERE lead_id = ? AND status != 'cancelled' LIMIT 1`,
    [lead_id]
  );

  let surveyId;
  if (existing.length > 0) {
    surveyId = existing[0].id;
    await db.query(
      `
      UPDATE site_surveys SET
        assigned_engineer_id = ?,
        scheduled_date = ?,
        scheduled_time = ?,
        site_notes = ?,
        status = 'scheduled',
        created_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        assigned_engineer_id || null,
        scheduled_date,
        scheduled_time,
        site_notes || null,
        createdBy || null,
        surveyId,
      ]
    );
  } else {
    const [result] = await db.query(
      `
      INSERT INTO site_surveys (
        lead_id, assigned_engineer_id, scheduled_date, scheduled_time,
        status, site_notes, created_by
      ) VALUES (?, ?, ?, ?, 'scheduled', ?, ?)
      `,
      [
        lead_id,
        assigned_engineer_id || null,
        scheduled_date,
        scheduled_time,
        site_notes || null,
        createdBy || null,
      ]
    );
    surveyId = result.insertId;
  }

  // Update lead status & site_visit_date
  await db.query(
    `UPDATE leads SET status = 'Site Visit Scheduled', site_visit_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [scheduled_date, lead_id]
  );

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
const getSurveyById = async (id, db = defaultDb) => {
  await ensureSurveyTable(db);
  const [rows] = await db.query(
    `
    SELECT s.*, 
           l.lead_code, l.customer_name, l.mobile_number, l.address, l.city, l.state, l.required_kw,
           u.full_name AS engineer_name, u.email AS engineer_email, u.phone AS engineer_phone
    FROM site_surveys s
    LEFT JOIN leads l ON s.lead_id = l.id
    LEFT JOIN users u ON s.assigned_engineer_id = u.id
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
           u.full_name AS engineer_name, u.email AS engineer_email, u.phone AS engineer_phone
    FROM site_surveys s
    LEFT JOIN leads l ON s.lead_id = l.id
    LEFT JOIN users u ON s.assigned_engineer_id = u.id
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
const completeSurvey = async (id, data, db = defaultDb) => {
  await ensureSurveyTable(db);
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
  } = data;

  const parseNum = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const safeRoofArea = parseNum(roof_area_sqft);
  const safeLoadKw = parseNum(sanctioned_load_kw);
  const safeLat = parseNum(gps_latitude);
  const safeLng = parseNum(gps_longitude);

  const photosJson = Array.isArray(photos) ? JSON.stringify(photos) : (typeof photos === "string" ? photos : null);

  await db.query(
    `
    UPDATE site_surveys SET
      roof_type = ?,
      roof_area_sqft = ?,
      shadow_conditions = ?,
      electrical_phase = ?,
      sanctioned_load_kw = ?,
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
      electrical_phase || "1-Phase",
      safeLoadKw,
      photosJson,
      site_notes || null,
      safeLat,
      safeLng,
      id,
    ]
  );

  const survey = await getSurveyById(id, db);
  if (survey && survey.lead_id) {
    // Update lead status to Survey Completed
    try {
      await db.query(
        `UPDATE leads SET status = 'Survey Completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [survey.lead_id]
      );
    } catch (err) {
      console.warn("Failed to update lead status to Survey Completed:", err.message);
      try {
        await db.query(
          `UPDATE leads SET status = 'Site Visit Scheduled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [survey.lead_id]
        );
      } catch (e) {}
    }

    // Log Activity
    try {
      await db.query(
        `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark) VALUES (?, 'Status Changed', 'Survey Completed', ?)`,
        [
          survey.lead_id,
          `Roof: ${roof_type || "RCC"} (${safeRoofArea || 0} sqft) · Elec: ${electrical_phase || "1-Phase"} (${safeLoadKw || 0} kW)`,
        ]
      );
    } catch (err) {
      console.error("Failed to log survey completion:", err);
    }
  }

  return survey;
};

// 5. Get All Surveys List
const getSurveysList = async (queryParams = {}, db = defaultDb) => {
  await ensureSurveyTable(db);
  const { status, engineer_id, search } = queryParams;
  let whereClauses = [];
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
           u.full_name AS engineer_name
    FROM site_surveys s
    LEFT JOIN leads l ON s.lead_id = l.id
    LEFT JOIN users u ON s.assigned_engineer_id = u.id
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

module.exports = {
  ensureSurveyTable,
  scheduleSurvey,
  getSurveyById,
  getSurveyByLeadId,
  completeSurvey,
  getSurveysList,
};
