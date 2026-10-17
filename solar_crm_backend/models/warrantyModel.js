const ensureWarrantyTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_warranty_amc (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      panel_warranty_years INT DEFAULT NULL,
      inverter_warranty_years INT DEFAULT NULL,
      installation_warranty_years INT DEFAULT NULL,
      warranty_start_date DATE DEFAULT NULL,
      warranty_end_date DATE DEFAULT NULL,
      amc_start_date DATE DEFAULT NULL,
      amc_end_date DATE DEFAULT NULL,
      amc_plan ENUM('Basic','Standard','Premium') DEFAULT NULL,
      amc_amount DECIMAL(10,2) DEFAULT NULL,
      visit_frequency ENUM('Monthly','Quarterly','Half-Yearly','Yearly') DEFAULT NULL,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS project_service_visits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      visit_date DATE NOT NULL,
      technician VARCHAR(100) DEFAULT NULL,
      issue_reported TEXT DEFAULT NULL,
      resolution TEXT DEFAULT NULL,
      status ENUM('Completed','Pending','Escalated') DEFAULT 'Completed',
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const getWarrantyAndVisits = async (db, projectId) => {
  const [warrantyRows] = await db.query(
    `SELECT * FROM project_warranty_amc WHERE project_id = ? AND is_deleted = 0 LIMIT 1`,
    [projectId]
  );
  const [visitsRows] = await db.query(
    `SELECT * FROM project_service_visits WHERE project_id = ? AND is_deleted = 0 ORDER BY visit_date DESC, created_at DESC`,
    [projectId]
  );
  return {
    warranty: warrantyRows[0] || null,
    visits: visitsRows || []
  };
};

const createWarranty = async (db, projectId, data, userId) => {
  const [result] = await db.query(
    `INSERT INTO project_warranty_amc (
      project_id, panel_warranty_years, inverter_warranty_years, installation_warranty_years,
      warranty_start_date, warranty_end_date, amc_start_date, amc_end_date,
      amc_plan, amc_amount, visit_frequency, created_by
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      projectId, data.panel_warranty_years, data.inverter_warranty_years, data.installation_warranty_years,
      data.warranty_start_date, data.warranty_end_date, data.amc_start_date, data.amc_end_date,
      data.amc_plan, data.amc_amount, data.visit_frequency, userId
    ]
  );
  return result.insertId;
};

const updateWarranty = async (db, projectId, data) => {
  await db.query(
    `UPDATE project_warranty_amc SET
      panel_warranty_years=?, inverter_warranty_years=?, installation_warranty_years=?,
      warranty_start_date=?, warranty_end_date=?, amc_start_date=?, amc_end_date=?,
      amc_plan=?, amc_amount=?, visit_frequency=?
     WHERE project_id=? AND is_deleted=0`,
    [
      data.panel_warranty_years, data.inverter_warranty_years, data.installation_warranty_years,
      data.warranty_start_date, data.warranty_end_date, data.amc_start_date, data.amc_end_date,
      data.amc_plan, data.amc_amount, data.visit_frequency, projectId
    ]
  );
};

const addServiceVisit = async (db, projectId, data, userId) => {
  const [result] = await db.query(
    `INSERT INTO project_service_visits (
      project_id, visit_date, technician, issue_reported, resolution, status, created_by
    ) VALUES (?,?,?,?,?,?,?)`,
    [
      projectId, data.visit_date, data.technician, data.issue_reported, data.resolution, data.status || 'Completed', userId
    ]
  );
  return result.insertId;
};

module.exports = {
  ensureWarrantyTable,
  getWarrantyAndVisits,
  createWarranty,
  updateWarranty,
  addServiceVisit
};
