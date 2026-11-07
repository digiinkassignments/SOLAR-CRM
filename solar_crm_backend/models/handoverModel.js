// models/handoverModel.js

const ensureHandoverTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_handover (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      training_completed VARCHAR(30) DEFAULT NULL,
      app_demo_completed VARCHAR(30) DEFAULT NULL,
      monitoring_app_access_shared TINYINT(1) DEFAULT 0,
      emergency_contact_given TINYINT(1) DEFAULT NULL,
      operation_manual TINYINT(1) DEFAULT NULL,
      warranty_card TINYINT(1) DEFAULT NULL,
      maintenance_schedule TINYINT(1) DEFAULT NULL,
      inverter_manual TINYINT(1) DEFAULT NULL,
      documents_pack_checklist JSON DEFAULT NULL,
      handover_date DATE DEFAULT NULL,
      handover_manager VARCHAR(100) DEFAULT NULL,
      warranty_start_date DATE DEFAULT NULL,
      module_warranty_years INT DEFAULT 25,
      module_warranty_end DATE DEFAULT NULL,
      inverter_warranty_years INT DEFAULT 5,
      inverter_warranty_end DATE DEFAULT NULL,
      workmanship_warranty_years INT DEFAULT 5,
      workmanship_warranty_end DATE DEFAULT NULL,
      amc_warranty_years INT DEFAULT 1,
      amc_warranty_end DATE DEFAULT NULL,
      first_service_due_date DATE DEFAULT NULL,
      customer_signature TINYINT(1) DEFAULT NULL,
      signed_docket_url TEXT DEFAULT NULL,
      signature_signatory_name VARCHAR(100) DEFAULT NULL,
      signature_phone VARCHAR(20) DEFAULT NULL,
      handover_photo_url TEXT DEFAULT NULL,
      customer_feedback TEXT DEFAULT NULL,
      customer_rating INT DEFAULT 5,
      review_token VARCHAR(100) DEFAULT NULL,
      review_status VARCHAR(30) DEFAULT 'pending',
      review_submitted_at DATETIME DEFAULT NULL,
      customer_reviewer_name VARCHAR(150) DEFAULT NULL,
      handover_status VARCHAR(60) DEFAULT 'Pending',
      remarks TEXT DEFAULT NULL,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM project_handover`);
    const existingCols = new Set(cols.map((c) => c.Field));

    if (!existingCols.has('monitoring_app_access_shared')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN monitoring_app_access_shared TINYINT(1) DEFAULT 0`);
    }
    if (!existingCols.has('documents_pack_checklist')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN documents_pack_checklist JSON DEFAULT NULL`);
    }
    if (!existingCols.has('module_warranty_years')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN module_warranty_years INT DEFAULT 25`);
    }
    if (!existingCols.has('module_warranty_end')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN module_warranty_end DATE DEFAULT NULL`);
    }
    if (!existingCols.has('inverter_warranty_years')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN inverter_warranty_years INT DEFAULT 5`);
    }
    if (!existingCols.has('inverter_warranty_end')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN inverter_warranty_end DATE DEFAULT NULL`);
    }
    if (!existingCols.has('workmanship_warranty_years')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN workmanship_warranty_years INT DEFAULT 5`);
    }
    if (!existingCols.has('workmanship_warranty_end')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN workmanship_warranty_end DATE DEFAULT NULL`);
    }
    if (!existingCols.has('amc_warranty_years')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN amc_warranty_years INT DEFAULT 1`);
    }
    if (!existingCols.has('amc_warranty_end')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN amc_warranty_end DATE DEFAULT NULL`);
    }
    if (!existingCols.has('first_service_due_date')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN first_service_due_date DATE DEFAULT NULL`);
    }
    if (!existingCols.has('signed_docket_url')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN signed_docket_url TEXT DEFAULT NULL`);
    }
    if (!existingCols.has('signature_signatory_name')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN signature_signatory_name VARCHAR(100) DEFAULT NULL`);
    }
    if (!existingCols.has('signature_phone')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN signature_phone VARCHAR(20) DEFAULT NULL`);
    }
    if (!existingCols.has('handover_photo_url')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN handover_photo_url TEXT DEFAULT NULL`);
    }
    if (!existingCols.has('customer_rating')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN customer_rating INT DEFAULT 5`);
    }
    if (!existingCols.has('review_token')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN review_token VARCHAR(100) DEFAULT NULL`);
    }
    if (!existingCols.has('review_status')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN review_status VARCHAR(30) DEFAULT 'pending'`);
    }
    if (!existingCols.has('review_submitted_at')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN review_submitted_at DATETIME DEFAULT NULL`);
    }
    if (!existingCols.has('customer_reviewer_name')) {
      await db.query(`ALTER TABLE project_handover ADD COLUMN customer_reviewer_name VARCHAR(150) DEFAULT NULL`);
    }

    await db.query(`ALTER TABLE project_handover MODIFY COLUMN handover_status VARCHAR(60) DEFAULT 'Pending'`);
    await db.query(`ALTER TABLE project_handover MODIFY COLUMN training_completed VARCHAR(30) DEFAULT NULL`);
    await db.query(`ALTER TABLE project_handover MODIFY COLUMN app_demo_completed VARCHAR(30) DEFAULT NULL`);
  } catch (err) {
    // Non-fatal
  }
};

const parseJsonField = (val) => {
  if (!val) return null;
  try {
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch {
    return null;
  }
};

const serializeJsonField = (val) => {
  if (!val) return null;
  return typeof val === 'object' ? JSON.stringify(val) : val;
};

const getHandover = async (db, projectId) => {
  await ensureHandoverTable(db);
  const [rows] = await db.query(
    `SELECT * FROM project_handover WHERE project_id = ? AND is_deleted = 0 LIMIT 1`,
    [projectId]
  );
  if (!rows[0]) return null;

  const r = rows[0];
  if (!r.review_token) {
    const genToken = `rev-${projectId}-${Date.now().toString(36)}`;
    await db.query(`UPDATE project_handover SET review_token = ? WHERE id = ?`, [genToken, r.id]).catch(() => {});
    r.review_token = genToken;
  }

  return {
    ...r,
    documents_pack_checklist: parseJsonField(r.documents_pack_checklist),
  };
};

const createHandover = async (db, projectId, data, userId) => {
  await ensureHandoverTable(db);
  const reviewToken = data.review_token || `rev-${projectId}-${Date.now().toString(36)}`;

  const fields = [
    'project_id', 'training_completed', 'app_demo_completed', 'monitoring_app_access_shared',
    'emergency_contact_given', 'operation_manual', 'warranty_card', 'maintenance_schedule',
    'inverter_manual', 'documents_pack_checklist', 'handover_date', 'handover_manager',
    'warranty_start_date', 'module_warranty_years', 'module_warranty_end',
    'inverter_warranty_years', 'inverter_warranty_end', 'workmanship_warranty_years',
    'workmanship_warranty_end', 'amc_warranty_years', 'amc_warranty_end',
    'first_service_due_date', 'customer_signature', 'signed_docket_url',
    'signature_signatory_name', 'signature_phone', 'handover_photo_url',
    'customer_feedback', 'customer_rating', 'review_token', 'review_status',
    'review_submitted_at', 'customer_reviewer_name', 'handover_status', 'remarks', 'created_by'
  ];

  const values = [
    projectId,
    data.training_completed || null,
    data.app_demo_completed || null,
    data.monitoring_app_access_shared ? 1 : 0,
    data.emergency_contact_given ? 1 : 0,
    data.operation_manual ? 1 : 0,
    data.warranty_card ? 1 : 0,
    data.maintenance_schedule ? 1 : 0,
    data.inverter_manual ? 1 : 0,
    serializeJsonField(data.documents_pack_checklist),
    data.handover_date || null,
    data.handover_manager || null,
    data.warranty_start_date || null,
    data.module_warranty_years || 25,
    data.module_warranty_end || null,
    data.inverter_warranty_years || 5,
    data.inverter_warranty_end || null,
    data.workmanship_warranty_years || 5,
    data.workmanship_warranty_end || null,
    data.amc_warranty_years || 1,
    data.amc_warranty_end || null,
    data.first_service_due_date || null,
    data.customer_signature ? 1 : 0,
    data.signed_docket_url || null,
    data.signature_signatory_name || null,
    data.signature_phone || null,
    data.handover_photo_url || null,
    data.customer_feedback || null,
    data.customer_rating || 5,
    reviewToken,
    data.review_status || 'pending',
    data.review_submitted_at || null,
    data.customer_reviewer_name || null,
    data.handover_status || 'Pending',
    data.remarks || null,
    userId || null
  ];

  const [result] = await db.query(
    `INSERT INTO project_handover (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
    values
  );

  // Sync project completion_date if handover is completed
  if (data.handover_status === 'Completed' && data.handover_date) {
    try {
      await db.query(`UPDATE projects SET completion_date = ? WHERE id = ?`, [data.handover_date, projectId]);
    } catch {}
  }

  return result.insertId;
};

const updateHandover = async (db, projectId, data) => {
  await ensureHandoverTable(db);
  await db.query(
    `UPDATE project_handover SET
      training_completed = ?,
      app_demo_completed = ?,
      monitoring_app_access_shared = ?,
      emergency_contact_given = ?,
      operation_manual = ?,
      warranty_card = ?,
      maintenance_schedule = ?,
      inverter_manual = ?,
      documents_pack_checklist = ?,
      handover_date = ?,
      handover_manager = ?,
      warranty_start_date = ?,
      module_warranty_years = ?,
      module_warranty_end = ?,
      inverter_warranty_years = ?,
      inverter_warranty_end = ?,
      workmanship_warranty_years = ?,
      workmanship_warranty_end = ?,
      amc_warranty_years = ?,
      amc_warranty_end = ?,
      first_service_due_date = ?,
      customer_signature = ?,
      signed_docket_url = ?,
      signature_signatory_name = ?,
      signature_phone = ?,
      handover_photo_url = ?,
      customer_feedback = COALESCE(?, customer_feedback),
      customer_rating = COALESCE(?, customer_rating),
      handover_status = ?,
      remarks = ?
    WHERE project_id = ? AND is_deleted = 0`,
    [
      data.training_completed || null,
      data.app_demo_completed || null,
      data.monitoring_app_access_shared ? 1 : 0,
      data.emergency_contact_given ? 1 : 0,
      data.operation_manual ? 1 : 0,
      data.warranty_card ? 1 : 0,
      data.maintenance_schedule ? 1 : 0,
      data.inverter_manual ? 1 : 0,
      serializeJsonField(data.documents_pack_checklist),
      data.handover_date || null,
      data.handover_manager || null,
      data.warranty_start_date || null,
      data.module_warranty_years || 25,
      data.module_warranty_end || null,
      data.inverter_warranty_years || 5,
      data.inverter_warranty_end || null,
      data.workmanship_warranty_years || 5,
      data.workmanship_warranty_end || null,
      data.amc_warranty_years || 1,
      data.amc_warranty_end || null,
      data.first_service_due_date || null,
      data.customer_signature ? 1 : 0,
      data.signed_docket_url || null,
      data.signature_signatory_name || null,
      data.signature_phone || null,
      data.handover_photo_url || null,
      data.customer_feedback !== undefined ? data.customer_feedback : null,
      data.customer_rating !== undefined ? data.customer_rating : null,
      data.handover_status || 'Pending',
      data.remarks || null,
      projectId
    ]
  );

  // Sync project completion_date if handover is completed
  if (data.handover_status === 'Completed' && data.handover_date) {
    try {
      await db.query(`UPDATE projects SET completion_date = ? WHERE id = ?`, [data.handover_date, projectId]);
    } catch {}
  }
};

// ── Public Customer Review Lookup ──
const getPublicHandoverReview = async (db, tokenOrId) => {
  await ensureHandoverTable(db);
  const isNumeric = !isNaN(tokenOrId) && !String(tokenOrId).startsWith('rev-');

  const [rows] = await db.query(
    `
    SELECT
      p.id AS project_id,
      p.project_number,
      p.customer_name,
      p.customer_phone,
      p.customer_address,
      p.city,
      p.state,
      p.system_capacity_kw,
      p.stage AS project_stage,
      h.id AS handover_id,
      h.review_token,
      COALESCE(h.customer_rating, 5) AS customer_rating,
      h.customer_feedback,
      COALESCE(h.review_status, 'pending') AS review_status,
      h.review_submitted_at,
      h.customer_reviewer_name,
      h.handover_date
    FROM projects p
    LEFT JOIN project_handover h ON h.project_id = p.id AND h.is_deleted = 0
    WHERE h.review_token = ? OR p.id = ? OR p.project_number = ?
    LIMIT 1
    `,
    [tokenOrId, isNumeric ? parseInt(tokenOrId, 10) : 0, tokenOrId]
  );

  if (rows.length === 0) return null;
  const item = rows[0];

  // If review_token not generated yet, generate and save
  if (!item.review_token && item.project_id) {
    const token = `rev-${item.project_id}-${Date.now().toString(36)}`;
    if (item.handover_id) {
      await db.query(`UPDATE project_handover SET review_token = ? WHERE id = ?`, [token, item.handover_id]).catch(() => {});
    }
    item.review_token = token;
  }

  return item;
};

// ── Submit Public Customer Review ──
const submitPublicHandoverReview = async (db, tokenOrId, data) => {
  await ensureHandoverTable(db);
  const projectInfo = await getPublicHandoverReview(db, tokenOrId);
  if (!projectInfo) {
    throw new Error('Project or review link not found.');
  }

  const rating = Math.min(5, Math.max(1, parseInt(data.rating, 10) || 5));
  const feedback = (data.feedback || '').trim();
  const reviewerName = (data.reviewer_name || projectInfo.customer_name || 'Customer').trim();

  if (projectInfo.handover_id) {
    await db.query(
      `
      UPDATE project_handover SET
        customer_rating = ?,
        customer_feedback = ?,
        review_status = 'submitted',
        review_submitted_at = NOW(),
        customer_reviewer_name = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [rating, feedback, reviewerName, projectInfo.handover_id]
    );
  } else {
    const token = projectInfo.review_token || `rev-${projectInfo.project_id}-${Date.now().toString(36)}`;
    await db.query(
      `
      INSERT INTO project_handover (
        project_id, customer_rating, customer_feedback, review_status, review_submitted_at, customer_reviewer_name, review_token, handover_status
      ) VALUES (?, ?, ?, 'submitted', NOW(), ?, ?, 'Pending')
      `,
      [projectInfo.project_id, rating, feedback, reviewerName, token]
    );
  }

  // Audit log in lead_activity_logs & project_stage_logs
  try {
    const [projRows] = await db.query(`SELECT lead_id, stage FROM projects WHERE id = ? LIMIT 1`, [projectInfo.project_id]);
    if (projRows.length > 0) {
      const p = projRows[0];
      const logNote = `Customer submitted ${rating}-Star Handover Review online: "${feedback || 'No written comments'}"`;
      if (p.lead_id) {
        await db.query(
          `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark) VALUES (?, 'Customer Review Received', ?, ?)`,
          [p.lead_id, `${rating} Stars`, logNote]
        ).catch(() => {});
      }
      await db.query(
        `INSERT INTO project_stage_logs (project_id, previous_stage, new_stage, changed_by, notes) VALUES (?, ?, ?, 1, ?)`,
        [projectInfo.project_id, p.stage, p.stage, logNote]
      ).catch(() => {});
    }
  } catch (e) {}

  return getPublicHandoverReview(db, tokenOrId);
};

module.exports = {
  ensureHandoverTable,
  getHandover,
  createHandover,
  updateHandover,
  getPublicHandoverReview,
  submitPublicHandoverReview,
};
