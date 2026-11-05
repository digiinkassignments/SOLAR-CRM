// models/finalInspectionModel.js

const ensureFinalInspectionTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_final_inspection (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      installation_quality VARCHAR(20) DEFAULT NULL,
      structure_checklist JSON DEFAULT NULL,
      safety_compliance VARCHAR(20) DEFAULT NULL,
      electrical_checklist JSON DEFAULT NULL,
      inverter_earthing_checklist JSON DEFAULT NULL,
      document_verification VARCHAR(20) DEFAULT NULL,
      documents_checklist JSON DEFAULT NULL,
      performance_testing VARCHAR(20) DEFAULT NULL,
      inspector_name VARCHAR(100) DEFAULT NULL,
      inspector_type VARCHAR(60) DEFAULT 'Internal QA / QC',
      inspection_date DATE DEFAULT NULL,
      inspection_status VARCHAR(60) DEFAULT 'Pending',
      corrections_needed TEXT DEFAULT NULL,
      rework_status VARCHAR(50) DEFAULT 'Not Applicable',
      reinspection_date DATE DEFAULT NULL,
      certificate_number VARCHAR(100) DEFAULT NULL,
      remarks TEXT DEFAULT NULL,
      inspection_photos TEXT DEFAULT NULL,
      customer_signature_name VARCHAR(100) DEFAULT NULL,
      customer_acknowledged TINYINT(1) DEFAULT 0,
      inspector_signoff TINYINT(1) DEFAULT 0,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM project_final_inspection`);
    const existingCols = new Set(cols.map((c) => c.Field));

    if (!existingCols.has('structure_checklist')) {
      await db.query(`ALTER TABLE project_final_inspection ADD COLUMN structure_checklist JSON DEFAULT NULL`);
    }
    if (!existingCols.has('electrical_checklist')) {
      await db.query(`ALTER TABLE project_final_inspection ADD COLUMN electrical_checklist JSON DEFAULT NULL`);
    }
    if (!existingCols.has('inverter_earthing_checklist')) {
      await db.query(`ALTER TABLE project_final_inspection ADD COLUMN inverter_earthing_checklist JSON DEFAULT NULL`);
    }
    if (!existingCols.has('documents_checklist')) {
      await db.query(`ALTER TABLE project_final_inspection ADD COLUMN documents_checklist JSON DEFAULT NULL`);
    }
    if (!existingCols.has('rework_status')) {
      await db.query(`ALTER TABLE project_final_inspection ADD COLUMN rework_status VARCHAR(50) DEFAULT 'Not Applicable'`);
    }
    if (!existingCols.has('reinspection_date')) {
      await db.query(`ALTER TABLE project_final_inspection ADD COLUMN reinspection_date DATE DEFAULT NULL`);
    }
    if (!existingCols.has('inspection_photos')) {
      await db.query(`ALTER TABLE project_final_inspection ADD COLUMN inspection_photos TEXT DEFAULT NULL`);
    }
    if (!existingCols.has('customer_signature_name')) {
      await db.query(`ALTER TABLE project_final_inspection ADD COLUMN customer_signature_name VARCHAR(100) DEFAULT NULL`);
    }
    if (!existingCols.has('customer_acknowledged')) {
      await db.query(`ALTER TABLE project_final_inspection ADD COLUMN customer_acknowledged TINYINT(1) DEFAULT 0`);
    }
    if (!existingCols.has('inspector_signoff')) {
      await db.query(`ALTER TABLE project_final_inspection ADD COLUMN inspector_signoff TINYINT(1) DEFAULT 0`);
    }
    await db.query(`ALTER TABLE project_final_inspection MODIFY COLUMN inspection_status VARCHAR(60) DEFAULT 'Pending'`);
    await db.query(`ALTER TABLE project_final_inspection MODIFY COLUMN inspector_type VARCHAR(60) DEFAULT 'Internal QA / QC'`);
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

const getFinalInspection = async (db, projectId) => {
  const [rows] = await db.query(
    `SELECT * FROM project_final_inspection WHERE project_id = ? AND is_deleted = 0 LIMIT 1`,
    [projectId]
  );
  if (!rows[0]) return null;

  const r = rows[0];
  return {
    ...r,
    structure_checklist: parseJsonField(r.structure_checklist),
    electrical_checklist: parseJsonField(r.electrical_checklist),
    inverter_earthing_checklist: parseJsonField(r.inverter_earthing_checklist),
    documents_checklist: parseJsonField(r.documents_checklist),
  };
};

const serializeJsonField = (val) => {
  if (!val) return null;
  return typeof val === 'object' ? JSON.stringify(val) : val;
};

const createFinalInspection = async (db, projectId, data, userId) => {
  const fields = [
    'project_id', 'installation_quality', 'structure_checklist', 'safety_compliance',
    'electrical_checklist', 'inverter_earthing_checklist', 'document_verification',
    'documents_checklist', 'performance_testing', 'inspector_name', 'inspector_type',
    'inspection_date', 'inspection_status', 'corrections_needed', 'rework_status',
    'reinspection_date', 'certificate_number', 'remarks', 'inspection_photos',
    'customer_signature_name', 'customer_acknowledged', 'inspector_signoff', 'created_by'
  ];

  const values = [
    projectId,
    data.installation_quality || null,
    serializeJsonField(data.structure_checklist),
    data.safety_compliance || null,
    serializeJsonField(data.electrical_checklist),
    serializeJsonField(data.inverter_earthing_checklist),
    data.document_verification || null,
    serializeJsonField(data.documents_checklist),
    data.performance_testing || null,
    data.inspector_name || null,
    data.inspector_type || 'Internal QA / QC',
    data.inspection_date || null,
    data.inspection_status || 'Pending',
    data.corrections_needed || null,
    data.rework_status || 'Not Applicable',
    data.reinspection_date || null,
    data.certificate_number || null,
    data.remarks || null,
    data.inspection_photos || null,
    data.customer_signature_name || null,
    data.customer_acknowledged ? 1 : 0,
    data.inspector_signoff ? 1 : 0,
    userId || null
  ];

  const [result] = await db.query(
    `INSERT INTO project_final_inspection (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
    values
  );
  return result.insertId;
};

const updateFinalInspection = async (db, projectId, data) => {
  await db.query(
    `UPDATE project_final_inspection SET
      installation_quality = ?,
      structure_checklist = ?,
      safety_compliance = ?,
      electrical_checklist = ?,
      inverter_earthing_checklist = ?,
      document_verification = ?,
      documents_checklist = ?,
      performance_testing = ?,
      inspector_name = ?,
      inspector_type = ?,
      inspection_date = ?,
      inspection_status = ?,
      corrections_needed = ?,
      rework_status = ?,
      reinspection_date = ?,
      certificate_number = ?,
      remarks = ?,
      inspection_photos = ?,
      customer_signature_name = ?,
      customer_acknowledged = ?,
      inspector_signoff = ?
    WHERE project_id = ? AND is_deleted = 0`,
    [
      data.installation_quality || null,
      serializeJsonField(data.structure_checklist),
      data.safety_compliance || null,
      serializeJsonField(data.electrical_checklist),
      serializeJsonField(data.inverter_earthing_checklist),
      data.document_verification || null,
      serializeJsonField(data.documents_checklist),
      data.performance_testing || null,
      data.inspector_name || null,
      data.inspector_type || 'Internal QA / QC',
      data.inspection_date || null,
      data.inspection_status || 'Pending',
      data.corrections_needed || null,
      data.rework_status || 'Not Applicable',
      data.reinspection_date || null,
      data.certificate_number || null,
      data.remarks || null,
      data.inspection_photos || null,
      data.customer_signature_name || null,
      data.customer_acknowledged ? 1 : 0,
      data.inspector_signoff ? 1 : 0,
      projectId
    ]
  );
};

module.exports = {
  ensureFinalInspectionTable,
  getFinalInspection,
  createFinalInspection,
  updateFinalInspection
};
