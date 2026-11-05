// models/warrantyModel.js

const ensureWarrantyTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_warranty_amc (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      warranty_certificate_no VARCHAR(60) DEFAULT NULL,
      panel_warranty_years INT DEFAULT NULL,
      panel_product_warranty_years INT DEFAULT 12,
      panel_product_warranty_end DATE DEFAULT NULL,
      panel_performance_warranty_years INT DEFAULT 25,
      panel_performance_warranty_end DATE DEFAULT NULL,
      inverter_warranty_years INT DEFAULT NULL,
      inverter_warranty_end DATE DEFAULT NULL,
      installation_warranty_years INT DEFAULT NULL,
      installation_warranty_end DATE DEFAULT NULL,
      warranty_start_date DATE DEFAULT NULL,
      warranty_end_date DATE DEFAULT NULL,
      free_service_end_date DATE DEFAULT NULL,
      amc_start_date DATE DEFAULT NULL,
      amc_end_date DATE DEFAULT NULL,
      amc_plan VARCHAR(60) DEFAULT 'Standard',
      amc_amount DECIMAL(10,2) DEFAULT 4500.00,
      amc_payment_status VARCHAR(50) DEFAULT 'Paid',
      amc_renewal_date DATE DEFAULT NULL,
      visit_frequency VARCHAR(50) DEFAULT 'Quarterly',
      panel_serial_numbers TEXT DEFAULT NULL,
      inverter_serial_number VARCHAR(100) DEFAULT NULL,
      monitoring_portal_url VARCHAR(255) DEFAULT 'https://monitoring.solaxcloud.com',
      monitoring_plant_id VARCHAR(100) DEFAULT 'SOLAR-PLANT-004',
      monitoring_username VARCHAR(100) DEFAULT 'rajesh.sharma@solax',
      warranty_docket_url TEXT DEFAULT NULL,
      scheduled_visits JSON DEFAULT NULL,
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
      status VARCHAR(50) DEFAULT 'Completed',
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
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

const getWarrantyAndVisits = async (db, projectId) => {
  const [warrantyRows] = await db.query(
    `SELECT * FROM project_warranty_amc WHERE project_id = ? AND is_deleted = 0 LIMIT 1`,
    [projectId]
  );
  const [visitsRows] = await db.query(
    `SELECT * FROM project_service_visits WHERE project_id = ? AND is_deleted = 0 ORDER BY visit_date ASC, id ASC`,
    [projectId]
  );

  const w = warrantyRows[0] || null;
  return {
    warranty: w ? { ...w, scheduled_visits: parseJsonField(w.scheduled_visits) } : null,
    visits: visitsRows || []
  };
};

const createWarranty = async (db, projectId, data, userId) => {
  const certNo = data.warranty_certificate_no || `WAR-${new Date().getFullYear()}-${String(projectId).padStart(4, '0')}`;

  const [result] = await db.query(
    `INSERT INTO project_warranty_amc (
      project_id, warranty_certificate_no,
      panel_warranty_years, panel_product_warranty_years, panel_product_warranty_end,
      panel_performance_warranty_years, panel_performance_warranty_end,
      inverter_warranty_years, inverter_warranty_end,
      installation_warranty_years, installation_warranty_end,
      warranty_start_date, warranty_end_date, free_service_end_date,
      amc_start_date, amc_end_date, amc_plan, amc_amount, amc_payment_status, amc_renewal_date,
      visit_frequency, panel_serial_numbers, inverter_serial_number,
      monitoring_portal_url, monitoring_plant_id, monitoring_username,
      warranty_docket_url, scheduled_visits, created_by
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      projectId, certNo,
      data.panel_warranty_years || 25,
      data.panel_product_warranty_years || 12,
      data.panel_product_warranty_end || null,
      data.panel_performance_warranty_years || 25,
      data.panel_performance_warranty_end || null,
      data.inverter_warranty_years || 5,
      data.inverter_warranty_end || null,
      data.installation_warranty_years || 5,
      data.installation_warranty_end || null,
      data.warranty_start_date || null,
      data.warranty_end_date || null,
      data.free_service_end_date || null,
      data.amc_start_date || null,
      data.amc_end_date || null,
      data.amc_plan || 'Standard',
      data.amc_amount || 4500.00,
      data.amc_payment_status || 'Paid',
      data.amc_renewal_date || null,
      data.visit_frequency || 'Quarterly',
      data.panel_serial_numbers || null,
      data.inverter_serial_number || null,
      data.monitoring_portal_url || 'https://monitoring.solaxcloud.com',
      data.monitoring_plant_id || 'SOLAR-PLANT-004',
      data.monitoring_username || 'rajesh.sharma@solax',
      data.warranty_docket_url || null,
      serializeJsonField(data.scheduled_visits),
      userId
    ]
  );
  return result.insertId;
};

const updateWarranty = async (db, projectId, data) => {
  await db.query(
    `UPDATE project_warranty_amc SET
      warranty_certificate_no = COALESCE(?, warranty_certificate_no),
      panel_warranty_years = ?,
      panel_product_warranty_years = ?,
      panel_product_warranty_end = ?,
      panel_performance_warranty_years = ?,
      panel_performance_warranty_end = ?,
      inverter_warranty_years = ?,
      inverter_warranty_end = ?,
      installation_warranty_years = ?,
      installation_warranty_end = ?,
      warranty_start_date = ?,
      warranty_end_date = ?,
      free_service_end_date = ?,
      amc_start_date = ?,
      amc_end_date = ?,
      amc_plan = ?,
      amc_amount = ?,
      amc_payment_status = ?,
      amc_renewal_date = ?,
      visit_frequency = ?,
      panel_serial_numbers = ?,
      inverter_serial_number = ?,
      monitoring_portal_url = ?,
      monitoring_plant_id = ?,
      monitoring_username = ?,
      warranty_docket_url = ?,
      scheduled_visits = ?
     WHERE project_id = ? AND is_deleted = 0`,
    [
      data.warranty_certificate_no || null,
      data.panel_warranty_years,
      data.panel_product_warranty_years || 12,
      data.panel_product_warranty_end || null,
      data.panel_performance_warranty_years || 25,
      data.panel_performance_warranty_end || null,
      data.inverter_warranty_years,
      data.inverter_warranty_end || null,
      data.installation_warranty_years,
      data.installation_warranty_end || null,
      data.warranty_start_date || null,
      data.warranty_end_date || null,
      data.free_service_end_date || null,
      data.amc_start_date || null,
      data.amc_end_date || null,
      data.amc_plan,
      data.amc_amount,
      data.amc_payment_status || 'Paid',
      data.amc_renewal_date || null,
      data.visit_frequency,
      data.panel_serial_numbers || null,
      data.inverter_serial_number || null,
      data.monitoring_portal_url || null,
      data.monitoring_plant_id || null,
      data.monitoring_username || null,
      data.warranty_docket_url || null,
      serializeJsonField(data.scheduled_visits),
      projectId
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

const updateServiceVisit = async (db, visitId, data) => {
  await db.query(
    `UPDATE project_service_visits SET
      visit_date = COALESCE(?, visit_date),
      technician = COALESCE(?, technician),
      issue_reported = COALESCE(?, issue_reported),
      resolution = COALESCE(?, resolution),
      status = COALESCE(?, status)
     WHERE id = ? AND is_deleted = 0`,
    [data.visit_date, data.technician, data.issue_reported, data.resolution, data.status, visitId]
  );
};

module.exports = {
  ensureWarrantyTable,
  getWarrantyAndVisits,
  createWarranty,
  updateWarranty,
  addServiceVisit,
  updateServiceVisit,
};
