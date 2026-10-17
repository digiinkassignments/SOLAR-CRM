// models/inspectionModel.js

const ensureInspectionTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_inspections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      roof_condition ENUM('Good','Fair','Poor') DEFAULT 'Good',
      roof_type VARCHAR(50) DEFAULT NULL,
      roof_area_sqft DECIMAL(10,2) DEFAULT NULL,
      roof_age_years INT DEFAULT NULL,
      structural_concerns TEXT DEFAULT NULL,
      existing_load_kw DECIMAL(10,2) DEFAULT NULL,
      meter_type ENUM('Single Phase','Three Phase') DEFAULT NULL,
      main_panel_capacity INT DEFAULT NULL,
      earthing_available TINYINT(1) DEFAULT NULL,
      electrical_issues TEXT DEFAULT NULL,
      shading_issues ENUM('None','Partial','Severe') DEFAULT 'None',
      shading_source VARCHAR(255) DEFAULT NULL,
      water_availability TINYINT(1) DEFAULT NULL,
      site_access ENUM('Easy','Moderate','Difficult') DEFAULT 'Easy',
      additional_challenges TEXT DEFAULT NULL,
      overall_status ENUM('Approved','Conditional Approval','Rejected') DEFAULT 'Approved',
      inspector_name VARCHAR(100) DEFAULT NULL,
      inspection_date DATE DEFAULT NULL,
      remarks TEXT DEFAULT NULL,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const getInspectionByProject = async (db, projectId) => {
  const [rows] = await db.query(
    `SELECT * FROM project_inspections WHERE project_id = ? AND is_deleted = 0 LIMIT 1`,
    [projectId]
  );
  return rows[0] || null;
};

const createInspection = async (db, projectId, data, userId) => {
  const fields = [
    'project_id','roof_condition','roof_type','roof_area_sqft','roof_age_years',
    'structural_concerns','existing_load_kw','meter_type','main_panel_capacity',
    'earthing_available','electrical_issues','shading_issues','shading_source',
    'water_availability','site_access','additional_challenges','overall_status',
    'inspector_name','inspection_date','remarks','created_by'
  ];
  const values = [
    projectId, data.roof_condition, data.roof_type, data.roof_area_sqft, data.roof_age_years,
    data.structural_concerns, data.existing_load_kw, data.meter_type, data.main_panel_capacity,
    data.earthing_available ? 1 : 0, data.electrical_issues, data.shading_issues, data.shading_source,
    data.water_availability ? 1 : 0, data.site_access, data.additional_challenges, data.overall_status,
    data.inspector_name, data.inspection_date, data.remarks, userId
  ];
  const [result] = await db.query(
    `INSERT INTO project_inspections (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
    values
  );
  return result.insertId;
};

const updateInspection = async (db, projectId, data) => {
  await db.query(
    `UPDATE project_inspections SET
      roof_condition=?, roof_type=?, roof_area_sqft=?, roof_age_years=?,
      structural_concerns=?, existing_load_kw=?, meter_type=?, main_panel_capacity=?,
      earthing_available=?, electrical_issues=?, shading_issues=?, shading_source=?,
      water_availability=?, site_access=?, additional_challenges=?, overall_status=?,
      inspector_name=?, inspection_date=?, remarks=?
    WHERE project_id=? AND is_deleted=0`,
    [
      data.roof_condition, data.roof_type, data.roof_area_sqft, data.roof_age_years,
      data.structural_concerns, data.existing_load_kw, data.meter_type, data.main_panel_capacity,
      data.earthing_available ? 1 : 0, data.electrical_issues, data.shading_issues, data.shading_source,
      data.water_availability ? 1 : 0, data.site_access, data.additional_challenges, data.overall_status,
      data.inspector_name, data.inspection_date, data.remarks,
      projectId
    ]
  );
};

module.exports = { ensureInspectionTable, getInspectionByProject, createInspection, updateInspection };
