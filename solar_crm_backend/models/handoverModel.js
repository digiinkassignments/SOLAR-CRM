const ensureHandoverTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_handover (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      training_completed ENUM('Completed','Pending') DEFAULT NULL,
      app_demo_completed ENUM('Completed','Pending') DEFAULT NULL,
      emergency_contact_given TINYINT(1) DEFAULT NULL,
      operation_manual TINYINT(1) DEFAULT NULL,
      warranty_card TINYINT(1) DEFAULT NULL,
      maintenance_schedule TINYINT(1) DEFAULT NULL,
      inverter_manual TINYINT(1) DEFAULT NULL,
      handover_date DATE DEFAULT NULL,
      handover_manager VARCHAR(100) DEFAULT NULL,
      warranty_start_date DATE DEFAULT NULL,
      customer_signature TINYINT(1) DEFAULT NULL,
      customer_feedback TEXT DEFAULT NULL,
      handover_status ENUM('Completed','Pending','Issues Reported') DEFAULT NULL,
      remarks TEXT DEFAULT NULL,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const getHandover = async (db, projectId) => {
  const [rows] = await db.query(`SELECT * FROM project_handover WHERE project_id = ? AND is_deleted = 0 LIMIT 1`, [projectId]);
  return rows[0] || null;
};

const createHandover = async (db, projectId, data, userId) => {
  const [result] = await db.query(
    `INSERT INTO project_handover (project_id, training_completed, app_demo_completed, emergency_contact_given, operation_manual, warranty_card, maintenance_schedule, inverter_manual, handover_date, handover_manager, warranty_start_date, customer_signature, customer_feedback, handover_status, remarks, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [projectId, data.training_completed, data.app_demo_completed, data.emergency_contact_given?1:0, data.operation_manual?1:0, data.warranty_card?1:0, data.maintenance_schedule?1:0, data.inverter_manual?1:0, data.handover_date, data.handover_manager, data.warranty_start_date, data.customer_signature?1:0, data.customer_feedback, data.handover_status, data.remarks, userId]
  );
  return result.insertId;
};

const updateHandover = async (db, projectId, data) => {
  await db.query(
    `UPDATE project_handover SET training_completed=?, app_demo_completed=?, emergency_contact_given=?, operation_manual=?, warranty_card=?, maintenance_schedule=?, inverter_manual=?, handover_date=?, handover_manager=?, warranty_start_date=?, customer_signature=?, customer_feedback=?, handover_status=?, remarks=? WHERE project_id=? AND is_deleted=0`,
    [data.training_completed, data.app_demo_completed, data.emergency_contact_given?1:0, data.operation_manual?1:0, data.warranty_card?1:0, data.maintenance_schedule?1:0, data.inverter_manual?1:0, data.handover_date, data.handover_manager, data.warranty_start_date, data.customer_signature?1:0, data.customer_feedback, data.handover_status, data.remarks, projectId]
  );
};

module.exports = { ensureHandoverTable, getHandover, createHandover, updateHandover };
