const ensureCommissioningTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_commissioning (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      panel_output_voltage DECIMAL(8,2) DEFAULT NULL,
      inverter_output_kw DECIMAL(8,2) DEFAULT NULL,
      ac_output_voltage DECIMAL(8,2) DEFAULT NULL,
      meter_reading_kwh DECIMAL(10,2) DEFAULT NULL,
      safety_shutdowns ENUM('Pass','Fail') DEFAULT NULL,
      grounding_check ENUM('Pass','Fail') DEFAULT NULL,
      wiring_insulation ENUM('Pass','Fail') DEFAULT NULL,
      earth_leakage ENUM('Pass','Fail') DEFAULT NULL,
      overall_result ENUM('Passed','Failed','Conditional Pass') DEFAULT NULL,
      commission_date DATE DEFAULT NULL,
      commissioning_engineer VARCHAR(100) DEFAULT NULL,
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

const getCommissioning = async (db, projectId) => {
  const [rows] = await db.query(`SELECT * FROM project_commissioning WHERE project_id = ? AND is_deleted = 0 LIMIT 1`, [projectId]);
  return rows[0] || null;
};

const createCommissioning = async (db, projectId, data, userId) => {
  const [result] = await db.query(
    `INSERT INTO project_commissioning (project_id, panel_output_voltage, inverter_output_kw, ac_output_voltage, meter_reading_kwh, safety_shutdowns, grounding_check, wiring_insulation, earth_leakage, overall_result, commission_date, commissioning_engineer, certificate_number, remarks, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [projectId, data.panel_output_voltage, data.inverter_output_kw, data.ac_output_voltage, data.meter_reading_kwh, data.safety_shutdowns, data.grounding_check, data.wiring_insulation, data.earth_leakage, data.overall_result, data.commission_date, data.commissioning_engineer, data.certificate_number, data.remarks, userId]
  );
  return result.insertId;
};

const updateCommissioning = async (db, projectId, data) => {
  await db.query(
    `UPDATE project_commissioning SET panel_output_voltage=?, inverter_output_kw=?, ac_output_voltage=?, meter_reading_kwh=?, safety_shutdowns=?, grounding_check=?, wiring_insulation=?, earth_leakage=?, overall_result=?, commission_date=?, commissioning_engineer=?, certificate_number=?, remarks=? WHERE project_id=? AND is_deleted=0`,
    [data.panel_output_voltage, data.inverter_output_kw, data.ac_output_voltage, data.meter_reading_kwh, data.safety_shutdowns, data.grounding_check, data.wiring_insulation, data.earth_leakage, data.overall_result, data.commission_date, data.commissioning_engineer, data.certificate_number, data.remarks, projectId]
  );
};

module.exports = { ensureCommissioningTable, getCommissioning, createCommissioning, updateCommissioning };
