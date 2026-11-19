// models/warrantyModel.js

const readyColumns = new WeakSet();
const ensureWarrantyTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_warranty_amc (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      warranty_certificate_no VARCHAR(60) DEFAULT NULL,
      panel_warranty_years INT DEFAULT NULL,
      panel_product_warranty_years INT DEFAULT NULL,
      panel_product_warranty_end DATE DEFAULT NULL,
      panel_performance_warranty_years INT DEFAULT NULL,
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
      amc_plan VARCHAR(60) DEFAULT NULL,
      amc_amount DECIMAL(10,2) DEFAULT NULL,
      amc_payment_status VARCHAR(50) DEFAULT NULL,
      amc_renewal_date DATE DEFAULT NULL,
      visit_frequency VARCHAR(50) DEFAULT NULL,
      panel_serial_numbers TEXT DEFAULT NULL,
      inverter_serial_number VARCHAR(100) DEFAULT NULL,
      monitoring_portal_url VARCHAR(255) DEFAULT NULL,
      monitoring_plant_id VARCHAR(100) DEFAULT NULL,
      monitoring_username VARCHAR(100) DEFAULT NULL,
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
  if (!readyColumns.has(db)) {
    for (const definition of ['amc_plan_id INT DEFAULT NULL', 'amc_plan_snapshot JSON DEFAULT NULL']) {
      try { await db.query(`ALTER TABLE project_warranty_amc ADD COLUMN ${definition}`); }
      catch (error) { if (error.code !== 'ER_DUP_FIELDNAME') throw error; }
    }
    readyColumns.add(db);
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

const cleanDate = (d) => {
  if (!d) return null;
  const s = String(d).trim();
  if (!s || s === 'null' || s === 'undefined') return null;
  return s.length >= 10 ? s.substring(0, 10) : s;
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
    warranty: w ? { ...w, amc_plan_snapshot: parseJsonField(w.amc_plan_snapshot), scheduled_visits: parseJsonField(w.scheduled_visits) } : null,
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
      warranty_docket_url, scheduled_visits, created_by, amc_plan_id, amc_plan_snapshot
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      projectId, certNo,
      data.panel_warranty_years || null,
      data.panel_product_warranty_years || null,
      cleanDate(data.panel_product_warranty_end),
      data.panel_performance_warranty_years || null,
      cleanDate(data.panel_performance_warranty_end),
      data.inverter_warranty_years || null,
      cleanDate(data.inverter_warranty_end),
      data.installation_warranty_years || null,
      cleanDate(data.installation_warranty_end),
      cleanDate(data.warranty_start_date),
      cleanDate(data.warranty_end_date),
      cleanDate(data.free_service_end_date),
      cleanDate(data.amc_start_date),
      cleanDate(data.amc_end_date),
      data.amc_plan || null,
      data.amc_amount === '' || data.amc_amount == null ? null : data.amc_amount,
      data.amc_payment_status || null,
      cleanDate(data.amc_renewal_date),
      data.visit_frequency || null,
      data.panel_serial_numbers || null,
      data.inverter_serial_number || null,
      data.monitoring_portal_url || null,
      data.monitoring_plant_id || null,
      data.monitoring_username || null,
      data.warranty_docket_url || null,
      serializeJsonField(data.scheduled_visits),
      userId, data.amc_plan_id || null, serializeJsonField(data.amc_plan_snapshot)
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
      scheduled_visits = ?,
      amc_plan_id = ?,
      amc_plan_snapshot = ?
     WHERE project_id = ? AND is_deleted = 0`,
    [
      data.warranty_certificate_no || null,
      data.panel_warranty_years,
      data.panel_product_warranty_years || null,
      cleanDate(data.panel_product_warranty_end),
      data.panel_performance_warranty_years || null,
      cleanDate(data.panel_performance_warranty_end),
      data.inverter_warranty_years || null,
      cleanDate(data.inverter_warranty_end),
      data.installation_warranty_years || null,
      cleanDate(data.installation_warranty_end),
      cleanDate(data.warranty_start_date),
      cleanDate(data.warranty_end_date),
      cleanDate(data.free_service_end_date),
      cleanDate(data.amc_start_date),
      cleanDate(data.amc_end_date),
      data.amc_plan || null,
      data.amc_amount === '' || data.amc_amount == null ? null : data.amc_amount,
      data.amc_payment_status || null,
      cleanDate(data.amc_renewal_date),
      data.visit_frequency || null,
      data.panel_serial_numbers || null,
      data.inverter_serial_number || null,
      data.monitoring_portal_url || null,
      data.monitoring_plant_id || null,
      data.monitoring_username || null,
      data.warranty_docket_url || null,
      serializeJsonField(data.scheduled_visits),
      data.amc_plan_id || null, serializeJsonField(data.amc_plan_snapshot),
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
      projectId, cleanDate(data.visit_date), data.technician, data.issue_reported, data.resolution, data.status || 'Completed', userId
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
    [cleanDate(data.visit_date), data.technician, data.issue_reported, data.resolution, data.status, visitId]
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
