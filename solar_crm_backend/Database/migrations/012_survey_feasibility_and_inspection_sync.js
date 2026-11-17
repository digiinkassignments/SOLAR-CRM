// Migration 012: Sync Survey Feasibility, Field Ops & Pre-Install Inspection across all tenant DBs
const workflow = require("../../services/field/workflow");

async function up(conn) {
  const addColumnSafe = async (table, colName, colDef) => {
    try {
      const [cols] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [colName]);
      if (cols.length === 0) {
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${colDef}`);
      }
    } catch (e) {
      // ignore
    }
  };

  const modifyColumnSafe = async (table, colDef) => {
    try {
      await conn.query(`ALTER TABLE \`${table}\` MODIFY COLUMN ${colDef}`);
    } catch (e) {
      // ignore
    }
  };

  // 1. site_surveys table
  try {
    const [tbls] = await conn.query("SHOW TABLES LIKE 'site_surveys'");
    if (tbls.length > 0) {
      await addColumnSafe('site_surveys', 'consumer_number', '`consumer_number` VARCHAR(50) NULL');
      await addColumnSafe('site_surveys', 'feasibility_verdict', "`feasibility_verdict` VARCHAR(100) DEFAULT 'Feasible'");
      await addColumnSafe('site_surveys', 'not_feasible_reason', '`not_feasible_reason` TEXT NULL');
      await addColumnSafe('site_surveys', 'lead_action_on_not_feasible', '`lead_action_on_not_feasible` VARCHAR(100) NULL');
      await addColumnSafe('site_surveys', 'feasibility_notes', '`feasibility_notes` TEXT NULL');
      await addColumnSafe('site_surveys', 'roof_orientation', "`roof_orientation` VARCHAR(100) DEFAULT 'South'");
      await addColumnSafe('site_surveys', 'roof_tilt_angle', '`roof_tilt_angle` DECIMAL(5,2) NULL');
      await addColumnSafe('site_surveys', 'roof_ownership', "`roof_ownership` VARCHAR(150) DEFAULT 'Self-Owned'");
      await addColumnSafe('site_surveys', 'noc_status', "`noc_status` VARCHAR(100) DEFAULT 'NOC Not Required'");
      await addColumnSafe('site_surveys', 'proposed_capacity_kw', '`proposed_capacity_kw` DECIMAL(8,2) NULL');
      await addColumnSafe('site_surveys', 'is_approved', '`is_approved` TINYINT(1) DEFAULT 0');
      await addColumnSafe('site_surveys', 'approved_by', '`approved_by` INT NULL');
      await addColumnSafe('site_surveys', 'approved_at', '`approved_at` DATETIME NULL');
      await addColumnSafe('site_surveys', 'project_id', '`project_id` INT NULL');
      await addColumnSafe('site_surveys', 'site_address', '`site_address` TEXT NULL');
      await addColumnSafe('site_surveys', 'landmark', '`landmark` VARCHAR(255) NULL');
      await addColumnSafe('site_surveys', 'site_latitude', '`site_latitude` DECIMAL(12,8) NULL');
      await addColumnSafe('site_surveys', 'site_longitude', '`site_longitude` DECIMAL(12,8) NULL');

      // Expand columns to prevent ER_DATA_TOO_LONG
      await modifyColumnSafe('site_surveys', 'shadow_conditions TEXT NULL');
      await modifyColumnSafe('site_surveys', 'roof_type VARCHAR(100) NULL');
      await modifyColumnSafe('site_surveys', 'electrical_phase VARCHAR(50) NULL');
      await modifyColumnSafe('site_surveys', 'roof_orientation VARCHAR(100) NULL');
      await modifyColumnSafe('site_surveys', 'roof_ownership VARCHAR(150) NULL');
      await modifyColumnSafe('site_surveys', 'noc_status VARCHAR(100) NULL');
      await modifyColumnSafe('site_surveys', 'feasibility_verdict VARCHAR(100) NULL');
      await modifyColumnSafe('site_surveys', 'not_feasible_reason TEXT NULL');
      await modifyColumnSafe('site_surveys', 'lead_action_on_not_feasible VARCHAR(100) NULL');
      await modifyColumnSafe('site_surveys', 'gps_latitude DECIMAL(12,8) NULL');
      await modifyColumnSafe('site_surveys', 'gps_longitude DECIMAL(12,8) NULL');
      await modifyColumnSafe('site_surveys', 'site_latitude DECIMAL(12,8) NULL');
      await modifyColumnSafe('site_surveys', 'site_longitude DECIMAL(12,8) NULL');
    }
  } catch (err) {
    console.warn('[Migration 012 Note - site_surveys]:', err.message);
  }

  // 2. leads table
  try {
    const [tbls] = await conn.query("SHOW TABLES LIKE 'leads'");
    if (tbls.length > 0) {
      await addColumnSafe('leads', 'consumer_number', '`consumer_number` VARCHAR(50) NULL');
      await modifyColumnSafe('leads', "status VARCHAR(100) NOT NULL DEFAULT 'New Lead'");
      await modifyColumnSafe('leads', 'mobile_number VARCHAR(50) NOT NULL');
      await modifyColumnSafe('leads', 'alternate_number VARCHAR(50) NULL');
    }
  } catch (err) {
    console.warn('[Migration 012 Note - leads]:', err.message);
  }

  // 3. users table
  try {
    const [tbls] = await conn.query("SHOW TABLES LIKE 'users'");
    if (tbls.length > 0) {
      await modifyColumnSafe('users', 'phone VARCHAR(50) NULL');
    }
  } catch (err) {
    console.warn('[Migration 012 Note - users]:', err.message);
  }

  // 4. project_inspections table
  try {
    const [tbls] = await conn.query("SHOW TABLES LIKE 'project_inspections'");
    if (tbls.length > 0) {
      await addColumnSafe('project_inspections', 'consumer_number', '`consumer_number` VARCHAR(100) NULL');
      await addColumnSafe('project_inspections', 'roof_orientation', "`roof_orientation` VARCHAR(50) DEFAULT 'South'");
      await addColumnSafe('project_inspections', 'roof_tilt_angle', '`roof_tilt_angle` DECIMAL(5,2) NULL');
      await addColumnSafe('project_inspections', 'shadow_free_area_sqft', '`shadow_free_area_sqft` DECIMAL(10,2) NULL');
      await addColumnSafe('project_inspections', 'sanctioned_load_kw', '`sanctioned_load_kw` DECIMAL(10,2) NULL');
      await addColumnSafe('project_inspections', 'gps_coordinates', '`gps_coordinates` VARCHAR(100) NULL');
      await addColumnSafe('project_inspections', 'site_photos', '`site_photos` TEXT NULL');
      await addColumnSafe('project_inspections', 'customer_signature_name', '`customer_signature_name` VARCHAR(100) NULL');
      await addColumnSafe('project_inspections', 'signature_date', '`signature_date` DATE NULL');
      await addColumnSafe('project_inspections', 'signature_data', '`signature_data` LONGTEXT NULL');
      await modifyColumnSafe('project_inspections', "overall_status VARCHAR(50) DEFAULT 'Pending'");
    }
  } catch (err) {
    console.warn('[Migration 012 Note - project_inspections]:', err.message);
  }

  // 5. Ensure Site Engineer role exists
  try {
    await conn.query(`
      INSERT IGNORE INTO roles (id, role_name, description, status) 
      VALUES (4, 'Site Engineer', 'Conduct site surveys, feasibility checks & technical visits', 'Active')
    `);
  } catch (e) {}

  // 6. Ensure field operations tables exist
  try {
    if (workflow && typeof workflow.ensure === 'function') {
      await workflow.ensure(conn);
    }
  } catch (e) {}
}

module.exports = { up };

