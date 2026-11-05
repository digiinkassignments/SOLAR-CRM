// models/commissioningModel.js

const ensureCommissioningTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_commissioning (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      panel_output_voltage DECIMAL(8,2) DEFAULT NULL,
      dc_current_amps DECIMAL(8,2) DEFAULT NULL,
      inverter_output_kw DECIMAL(8,2) DEFAULT NULL,
      inverter_display_status VARCHAR(100) DEFAULT NULL,
      ac_output_voltage DECIMAL(8,2) DEFAULT NULL,
      meter_reading_kwh DECIMAL(10,2) DEFAULT NULL,
      meter_serial_number VARCHAR(100) DEFAULT NULL,
      net_meter_import_kwh DECIMAL(10,2) DEFAULT NULL,
      net_meter_export_kwh DECIMAL(10,2) DEFAULT NULL,
      generation_meter_kwh DECIMAL(10,2) DEFAULT NULL,
      safety_shutdowns VARCHAR(20) DEFAULT NULL,
      anti_islanding_test VARCHAR(20) DEFAULT NULL,
      grounding_check VARCHAR(20) DEFAULT NULL,
      earth_resistance_ohm DECIMAL(8,2) DEFAULT NULL,
      wiring_insulation VARCHAR(20) DEFAULT NULL,
      insulation_resistance_mohm DECIMAL(8,2) DEFAULT NULL,
      earth_leakage VARCHAR(20) DEFAULT NULL,
      overall_result VARCHAR(50) DEFAULT 'Pending',
      commission_date DATE DEFAULT NULL,
      commissioning_engineer VARCHAR(100) DEFAULT NULL,
      certificate_number VARCHAR(100) DEFAULT NULL,
      remarks TEXT DEFAULT NULL,
      meter_photo_url TEXT DEFAULT NULL,
      inverter_photo_url TEXT DEFAULT NULL,
      customer_signature_name VARCHAR(100) DEFAULT NULL,
      customer_acknowledged TINYINT(1) DEFAULT 0,
      engineer_signoff TINYINT(1) DEFAULT 0,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM project_commissioning`);
    const existingCols = new Set(cols.map((c) => c.Field));

    if (!existingCols.has('anti_islanding_test')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN anti_islanding_test VARCHAR(20) DEFAULT NULL`);
    }
    if (!existingCols.has('insulation_resistance_mohm')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN insulation_resistance_mohm DECIMAL(8,2) DEFAULT NULL`);
    }
    if (!existingCols.has('earth_resistance_ohm')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN earth_resistance_ohm DECIMAL(8,2) DEFAULT NULL`);
    }
    if (!existingCols.has('dc_current_amps')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN dc_current_amps DECIMAL(8,2) DEFAULT NULL`);
    }
    if (!existingCols.has('inverter_display_status')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN inverter_display_status VARCHAR(100) DEFAULT NULL`);
    }
    if (!existingCols.has('meter_serial_number')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN meter_serial_number VARCHAR(100) DEFAULT NULL`);
    }
    if (!existingCols.has('net_meter_import_kwh')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN net_meter_import_kwh DECIMAL(10,2) DEFAULT NULL`);
    }
    if (!existingCols.has('net_meter_export_kwh')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN net_meter_export_kwh DECIMAL(10,2) DEFAULT NULL`);
    }
    if (!existingCols.has('generation_meter_kwh')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN generation_meter_kwh DECIMAL(10,2) DEFAULT NULL`);
    }
    if (!existingCols.has('meter_photo_url')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN meter_photo_url TEXT DEFAULT NULL`);
    }
    if (!existingCols.has('inverter_photo_url')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN inverter_photo_url TEXT DEFAULT NULL`);
    }
    if (!existingCols.has('customer_signature_name')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN customer_signature_name VARCHAR(100) DEFAULT NULL`);
    }
    if (!existingCols.has('customer_acknowledged')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN customer_acknowledged TINYINT(1) DEFAULT 0`);
    }
    if (!existingCols.has('engineer_signoff')) {
      await db.query(`ALTER TABLE project_commissioning ADD COLUMN engineer_signoff TINYINT(1) DEFAULT 0`);
    }
    await db.query(`ALTER TABLE project_commissioning MODIFY COLUMN overall_result VARCHAR(50) DEFAULT 'Pending'`);
  } catch (err) {
    // Non-fatal
  }
};

const getCommissioning = async (db, projectId) => {
  const [rows] = await db.query(
    `SELECT * FROM project_commissioning WHERE project_id = ? AND is_deleted = 0 LIMIT 1`,
    [projectId]
  );
  return rows[0] || null;
};

const createCommissioning = async (db, projectId, data, userId) => {
  const fields = [
    'project_id', 'panel_output_voltage', 'dc_current_amps', 'inverter_output_kw',
    'inverter_display_status', 'ac_output_voltage', 'meter_reading_kwh', 'meter_serial_number',
    'net_meter_import_kwh', 'net_meter_export_kwh', 'generation_meter_kwh',
    'safety_shutdowns', 'anti_islanding_test', 'grounding_check', 'earth_resistance_ohm',
    'wiring_insulation', 'insulation_resistance_mohm', 'earth_leakage',
    'overall_result', 'commission_date', 'commissioning_engineer', 'certificate_number',
    'remarks', 'meter_photo_url', 'inverter_photo_url', 'customer_signature_name',
    'customer_acknowledged', 'engineer_signoff', 'created_by'
  ];

  const values = [
    projectId,
    data.panel_output_voltage ?? null,
    data.dc_current_amps ?? null,
    data.inverter_output_kw ?? null,
    data.inverter_display_status || null,
    data.ac_output_voltage ?? null,
    data.meter_reading_kwh ?? null,
    data.meter_serial_number || null,
    data.net_meter_import_kwh ?? null,
    data.net_meter_export_kwh ?? null,
    data.generation_meter_kwh ?? null,
    data.safety_shutdowns || null,
    data.anti_islanding_test || null,
    data.grounding_check || null,
    data.earth_resistance_ohm ?? null,
    data.wiring_insulation || null,
    data.insulation_resistance_mohm ?? null,
    data.earth_leakage || null,
    data.overall_result || 'Pending',
    data.commission_date || null,
    data.commissioning_engineer || null,
    data.certificate_number || null,
    data.remarks || null,
    data.meter_photo_url || null,
    data.inverter_photo_url || null,
    data.customer_signature_name || null,
    data.customer_acknowledged ? 1 : 0,
    data.engineer_signoff ? 1 : 0,
    userId || null
  ];

  const [result] = await db.query(
    `INSERT INTO project_commissioning (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
    values
  );
  return result.insertId;
};

const updateCommissioning = async (db, projectId, data) => {
  await db.query(
    `UPDATE project_commissioning SET
      panel_output_voltage = ?,
      dc_current_amps = ?,
      inverter_output_kw = ?,
      inverter_display_status = ?,
      ac_output_voltage = ?,
      meter_reading_kwh = ?,
      meter_serial_number = ?,
      net_meter_import_kwh = ?,
      net_meter_export_kwh = ?,
      generation_meter_kwh = ?,
      safety_shutdowns = ?,
      anti_islanding_test = ?,
      grounding_check = ?,
      earth_resistance_ohm = ?,
      wiring_insulation = ?,
      insulation_resistance_mohm = ?,
      earth_leakage = ?,
      overall_result = ?,
      commission_date = ?,
      commissioning_engineer = ?,
      certificate_number = ?,
      remarks = ?,
      meter_photo_url = ?,
      inverter_photo_url = ?,
      customer_signature_name = ?,
      customer_acknowledged = ?,
      engineer_signoff = ?
    WHERE project_id = ? AND is_deleted = 0`,
    [
      data.panel_output_voltage ?? null,
      data.dc_current_amps ?? null,
      data.inverter_output_kw ?? null,
      data.inverter_display_status || null,
      data.ac_output_voltage ?? null,
      data.meter_reading_kwh ?? null,
      data.meter_serial_number || null,
      data.net_meter_import_kwh ?? null,
      data.net_meter_export_kwh ?? null,
      data.generation_meter_kwh ?? null,
      data.safety_shutdowns || null,
      data.anti_islanding_test || null,
      data.grounding_check || null,
      data.earth_resistance_ohm ?? null,
      data.wiring_insulation || null,
      data.insulation_resistance_mohm ?? null,
      data.earth_leakage || null,
      data.overall_result || 'Pending',
      data.commission_date || null,
      data.commissioning_engineer || null,
      data.certificate_number || null,
      data.remarks || null,
      data.meter_photo_url || null,
      data.inverter_photo_url || null,
      data.customer_signature_name || null,
      data.customer_acknowledged ? 1 : 0,
      data.engineer_signoff ? 1 : 0,
      projectId
    ]
  );
};

module.exports = {
  ensureCommissioningTable,
  getCommissioning,
  createCommissioning,
  updateCommissioning
};
