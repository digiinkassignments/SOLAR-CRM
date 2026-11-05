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
  const [rows] = await db.query(
    `SELECT * FROM project_handover WHERE project_id = ? AND is_deleted = 0 LIMIT 1`,
    [projectId]
  );
  if (!rows[0]) return null;

  const r = rows[0];
  return {
    ...r,
    documents_pack_checklist: parseJsonField(r.documents_pack_checklist),
  };
};

const createHandover = async (db, projectId, data, userId) => {
  const fields = [
    'project_id', 'training_completed', 'app_demo_completed', 'monitoring_app_access_shared',
    'emergency_contact_given', 'operation_manual', 'warranty_card', 'maintenance_schedule',
    'inverter_manual', 'documents_pack_checklist', 'handover_date', 'handover_manager',
    'warranty_start_date', 'module_warranty_years', 'module_warranty_end',
    'inverter_warranty_years', 'inverter_warranty_end', 'workmanship_warranty_years',
    'workmanship_warranty_end', 'amc_warranty_years', 'amc_warranty_end',
    'first_service_due_date', 'customer_signature', 'signed_docket_url',
    'signature_signatory_name', 'signature_phone', 'handover_photo_url',
    'customer_feedback', 'customer_rating', 'handover_status', 'remarks', 'created_by'
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
      customer_feedback = ?,
      customer_rating = ?,
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
      data.customer_feedback || null,
      data.customer_rating || 5,
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

module.exports = {
  ensureHandoverTable,
  getHandover,
  createHandover,
  updateHandover
};
