const ensureFinalInspectionTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_final_inspection (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      installation_quality ENUM('Pass','Fail') DEFAULT NULL,
      safety_compliance ENUM('Pass','Fail') DEFAULT NULL,
      document_verification ENUM('Pass','Fail') DEFAULT NULL,
      performance_testing ENUM('Pass','Fail') DEFAULT NULL,
      inspector_name VARCHAR(100) DEFAULT NULL,
      inspector_type ENUM('Internal','Government','Third Party') DEFAULT NULL,
      inspection_date DATE DEFAULT NULL,
      inspection_status ENUM('Approved','Rejected','Re-inspection Required') DEFAULT NULL,
      corrections_needed TEXT DEFAULT NULL,
      certificate_number VARCHAR(100) DEFAULT NULL,
      remarks TEXT DEFAULT NULL,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const getFinalInspection = async (db, projectId) => {
  const [rows] = await db.query(`SELECT * FROM project_final_inspection WHERE project_id = ? AND is_deleted = 0 LIMIT 1`, [projectId]);
  return rows[0] || null;
};

const createFinalInspection = async (db, projectId, data, userId) => {
  const [result] = await db.query(
    `INSERT INTO project_final_inspection (project_id, installation_quality, safety_compliance, document_verification, performance_testing, inspector_name, inspector_type, inspection_date, inspection_status, corrections_needed, certificate_number, remarks, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [projectId, data.installation_quality, data.safety_compliance, data.document_verification, data.performance_testing, data.inspector_name, data.inspector_type, data.inspection_date, data.inspection_status, data.corrections_needed, data.certificate_number, data.remarks, userId]
  );
  return result.insertId;
};

const updateFinalInspection = async (db, projectId, data) => {
  await db.query(
    `UPDATE project_final_inspection SET installation_quality=?, safety_compliance=?, document_verification=?, performance_testing=?, inspector_name=?, inspector_type=?, inspection_date=?, inspection_status=?, corrections_needed=?, certificate_number=?, remarks=? WHERE project_id=? AND is_deleted=0`,
    [data.installation_quality, data.safety_compliance, data.document_verification, data.performance_testing, data.inspector_name, data.inspector_type, data.inspection_date, data.inspection_status, data.corrections_needed, data.certificate_number, data.remarks, projectId]
  );
};

module.exports = { ensureFinalInspectionTable, getFinalInspection, createFinalInspection, updateFinalInspection };
