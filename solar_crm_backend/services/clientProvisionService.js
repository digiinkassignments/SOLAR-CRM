// ============================================================
// CLIENT PROVISIONING SERVICE
// Super Admin jab naya client create kare tab:
// 1. Master DB mein client record banao
// 2. Nayi client DB banao (db_client_XXX)
// 3. Solar CRM schema install karo us DB mein
// 4. Default admin user banao client ke liye
// 5. Welcome email bhejo
// ============================================================

const mysql  = require("mysql2").createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 5,
}).promise();

const bcrypt = require("bcrypt");
const { masterDb } = require("../config/masterDb");
const { getClientPool } = require("../config/clientDb");
const { sendSubscriptionEmail } = require("./subscriptionEmailService");

// ============================================================
// Generate unique client code — CLI001, CLI002...
// ============================================================
async function generateClientCode() {
  const [rows] = await masterDb.query(
    `SELECT client_code FROM clients ORDER BY id DESC LIMIT 1`
  );
  if (rows.length === 0) return "CLI001";

  const last = rows[0].client_code; // "CLI007"
  const num  = parseInt(last.replace("CLI", ""), 10);
  return `CLI${String(num + 1).padStart(3, "0")}`;
}

// ============================================================
// Generate DB name from client code — db_client_001
// ============================================================
function generateDbName(clientCode) {
  const num = clientCode.replace("CLI", ""); // "001"
  return `db_client_${num}`;
}

// ============================================================
// Create Client Database + Install Solar CRM Schema
// ============================================================
async function createClientDatabase(dbName) {
  // 1. DB create karo
  await mysql.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  // 2. Solar CRM schema install karo (same tables as existing solar_crm)
  const clientPool = getClientPool(dbName);

  // Roles table
  await clientPool.query(`
    CREATE TABLE IF NOT EXISTS \`roles\` (
      \`id\`          INT(11) NOT NULL AUTO_INCREMENT,
      \`role_name\`   VARCHAR(50) NOT NULL,
      \`description\` VARCHAR(255) DEFAULT NULL,
      \`status\`      ENUM('Active','Inactive') DEFAULT 'Active',
      \`created_at\`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`role_name\` (\`role_name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await clientPool.query(`
    INSERT IGNORE INTO \`roles\` (\`id\`, \`role_name\`, \`description\`) VALUES
    (1, 'Super Admin', 'Complete System Access'),
    (2, 'Manager',     'Manage Team & Leads'),
    (3, 'Sales',       'Handle Assigned Leads')
  `);

  // Users table
  await clientPool.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\`            INT(11) NOT NULL AUTO_INCREMENT,
      \`role_id\`       INT(11) NOT NULL,
      \`manager_id\`    INT(11) DEFAULT NULL,
      \`full_name\`     VARCHAR(100) NOT NULL,
      \`username\`      VARCHAR(50) NOT NULL,
      \`email\`         VARCHAR(150) NOT NULL,
      \`phone\`         VARCHAR(15) DEFAULT NULL,
      \`password\`      VARCHAR(255) NOT NULL,
      \`profile_image\` VARCHAR(255) DEFAULT NULL,
      \`status\`        ENUM('Active','Inactive') DEFAULT 'Active',
      \`is_deleted\`    TINYINT(1) DEFAULT 0,
      \`last_login\`    DATETIME DEFAULT NULL,
      \`created_by\`    INT(11) DEFAULT NULL,
      \`created_at\`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`fcm_token\`     TEXT DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\`    (\`email\`),
      UNIQUE KEY \`username\` (\`username\`),
      KEY \`fk_role\`    (\`role_id\`),
      KEY \`fk_manager\` (\`manager_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Leads table
  await clientPool.query(`
    CREATE TABLE IF NOT EXISTS \`leads\` (
      \`id\`                  INT(11) NOT NULL AUTO_INCREMENT,
      \`lead_code\`           VARCHAR(20) NOT NULL,
      \`customer_name\`       VARCHAR(150) NOT NULL,
      \`mobile_number\`       VARCHAR(15) NOT NULL,
      \`alternate_number\`    VARCHAR(15) DEFAULT NULL,
      \`email\`               VARCHAR(150) DEFAULT NULL,
      \`address\`             VARCHAR(255) DEFAULT NULL,
      \`city\`                VARCHAR(100) DEFAULT NULL,
      \`state\`               VARCHAR(100) DEFAULT NULL,
      \`pincode\`             VARCHAR(10) DEFAULT NULL,
      \`solar_requirement\`   ENUM('Residential','Commercial') NOT NULL DEFAULT 'Residential',
      \`interest_status\`     ENUM('Pending','Interested','Not Interested') NOT NULL DEFAULT 'Pending',
      \`required_kw\`         DECIMAL(6,2) DEFAULT NULL,
      \`remark\`              VARCHAR(500) DEFAULT NULL,
      \`lead_source\`         ENUM('Website','Call','Reference','Facebook','Google','Other') NOT NULL DEFAULT 'Other',
      \`priority\`            ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
      \`status\`              ENUM('New Lead','Contacted','Follow-up Pending','Site Visit Scheduled','Quotation Sent','Negotiation','Won','Lost','Not Interested') NOT NULL DEFAULT 'New Lead',
      \`assigned_to\`         INT(11) DEFAULT NULL,
      \`assigned_by\`         INT(11) DEFAULT NULL,
      \`created_by\`          INT(11) DEFAULT NULL,
      \`next_follow_up_date\` DATE DEFAULT NULL,
      \`site_visit_date\`     DATE DEFAULT NULL,
      \`quotation_amount\`    DECIMAL(12,2) DEFAULT NULL,
      \`closed_at\`           DATETIME DEFAULT NULL,
      \`is_deleted\`          TINYINT(1) NOT NULL DEFAULT 0,
      \`created_at\`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_leads_lead_code\` (\`lead_code\`),
      KEY \`idx_leads_status\`      (\`status\`),
      KEY \`idx_leads_assigned_to\` (\`assigned_to\`),
      KEY \`idx_leads_created_at\`  (\`created_at\`),
      KEY \`idx_leads_mobile\`      (\`mobile_number\`),
      KEY \`idx_leads_is_deleted\`  (\`is_deleted\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Lead followups
  await clientPool.query(`
    CREATE TABLE IF NOT EXISTS \`lead_followups\` (
      \`id\`                    INT(11) NOT NULL AUTO_INCREMENT,
      \`lead_id\`               INT(11) NOT NULL,
      \`note\`                  VARCHAR(500) NOT NULL,
      \`followup_type\`         ENUM('Call','WhatsApp','SMS','Meeting','Site Visit','Other') NOT NULL DEFAULT 'Call',
      \`status_after_followup\` ENUM('New Lead','Contacted','Follow-up Pending','Site Visit Scheduled','Quotation Sent','Negotiation','Won','Lost','Not Interested') DEFAULT NULL,
      \`follow_up_date\`        DATE DEFAULT NULL,
      \`created_by\`            INT(11) DEFAULT NULL,
      \`created_at\`            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_followups_lead\` (\`lead_id\`),
      KEY \`idx_followups_date\` (\`follow_up_date\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Lead activity logs
  await clientPool.query(`
    CREATE TABLE IF NOT EXISTS \`lead_activity_logs\` (
      \`id\`           INT(11) NOT NULL AUTO_INCREMENT,
      \`lead_id\`      INT(11) NOT NULL,
      \`action_type\`  ENUM('Lead Created','Lead Updated','Lead Assigned','Lead Reassigned','Status Changed','Follow-up Added','Quotation Sent','Site Visit Scheduled','Lead Closed') NOT NULL,
      \`old_value\`    VARCHAR(255) DEFAULT NULL,
      \`new_value\`    VARCHAR(255) DEFAULT NULL,
      \`remark\`       VARCHAR(500) DEFAULT NULL,
      \`performed_by\` INT(11) DEFAULT NULL,
      \`ip_address\`   VARCHAR(45) DEFAULT NULL,
      \`device\`       VARCHAR(255) DEFAULT NULL,
      \`created_at\`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_logs_lead\`       (\`lead_id\`),
      KEY \`idx_logs_action\`     (\`action_type\`),
      KEY \`idx_logs_created_at\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Lead assignments
  await clientPool.query(`
    CREATE TABLE IF NOT EXISTS \`lead_assignments\` (
      \`id\`          INT(11) NOT NULL AUTO_INCREMENT,
      \`lead_id\`     INT(11) NOT NULL,
      \`assigned_to\` INT(11) NOT NULL,
      \`assigned_by\` INT(11) DEFAULT NULL,
      \`created_at\`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_assignments_lead\`        (\`lead_id\`),
      KEY \`idx_assignments_assigned_to\` (\`assigned_to\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Notifications
  await clientPool.query(`
    CREATE TABLE IF NOT EXISTS \`notifications\` (
      \`id\`           INT(11) NOT NULL AUTO_INCREMENT,
      \`user_id\`      INT(11) NOT NULL,
      \`title\`        VARCHAR(255) NOT NULL,
      \`body\`         TEXT NOT NULL,
      \`type\`         VARCHAR(50) DEFAULT NULL,
      \`reference_id\` INT(11) DEFAULT NULL,
      \`is_read\`      TINYINT(4) DEFAULT 0,
      \`created_at\`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`user_id\` (\`user_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Password reset OTPs
  await clientPool.query(`
    CREATE TABLE IF NOT EXISTS \`password_reset_otps\` (
      \`id\`          INT(11) NOT NULL AUTO_INCREMENT,
      \`user_id\`     INT(11) NOT NULL,
      \`otp\`         VARCHAR(255) NOT NULL,
      \`expires_at\`  DATETIME NOT NULL,
      \`is_verified\` TINYINT(1) DEFAULT 0,
      \`created_at\`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`user_id\` (\`user_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Settings
  await clientPool.query(`
    CREATE TABLE IF NOT EXISTS \`settings\` (
      \`id\`                   INT(11) NOT NULL AUTO_INCREMENT,
      \`company_name\`         VARCHAR(255) NOT NULL,
      \`company_logo\`         VARCHAR(255) DEFAULT NULL,
      \`company_email\`        VARCHAR(255) DEFAULT NULL,
      \`company_phone\`        VARCHAR(20) DEFAULT NULL,
      \`website\`              VARCHAR(255) DEFAULT NULL,
      \`gst_number\`           VARCHAR(50) DEFAULT NULL,
      \`currency\`             VARCHAR(20) DEFAULT 'INR',
      \`timezone\`             VARCHAR(100) DEFAULT 'Asia/Kolkata',
      \`smtp_host\`            VARCHAR(255) DEFAULT NULL,
      \`smtp_port\`            VARCHAR(10) DEFAULT NULL,
      \`smtp_username\`        VARCHAR(255) DEFAULT NULL,
      \`smtp_password\`        TEXT DEFAULT NULL,
      \`email_notifications\`  TINYINT(1) DEFAULT 1,
      \`lead_notifications\`   TINYINT(1) DEFAULT 1,
      \`created_at\`           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log(`✅ Schema installed in ${dbName}`);
  return clientPool;
}

// ============================================================
// MAIN FUNCTION: provisionNewClient
// Super Admin controller se call hoga
// ============================================================
async function provisionNewClient({
  businessName,
  ownerName,
  email,
  phone,
  city,
  state,
  subdomain,
  planId,
  durationMonths = 1,
  createdBy,
}) {
  const clientCode = await generateClientCode();
  const dbName     = generateDbName(clientCode);

  // Subscription dates calculate karo
  const start     = new Date();
  const end       = new Date();
  if (durationMonths < 1) {
    const days = Math.round(durationMonths * 30);
    end.setDate(end.getDate() + days);
  } else {
    end.setMonth(end.getMonth() + durationMonths);
  }

  const graceEnd  = new Date(end);
  graceEnd.setDate(graceEnd.getDate());

  const deleteDate = new Date(end);
  deleteDate.setDate(deleteDate.getDate() + 20);

  const toDateStr = (d) => d.toISOString().split("T")[0];

  // 1. Master DB mein client record banao
  const [insertResult] = await masterDb.query(
    `INSERT INTO clients
      (client_code, business_name, owner_name, email, phone,
       city, state, subdomain, db_name, plan_id,
       subscription_start, subscription_end,
       grace_end_date, lock_date, delete_date,
       status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)`,
    [
      clientCode, businessName, ownerName, email, phone,
      city, state, subdomain, dbName, planId,
      toDateStr(start), toDateStr(end),
      toDateStr(graceEnd), toDateStr(graceEnd), toDateStr(deleteDate),
      createdBy,
    ]
  );
  const clientId = insertResult.insertId;

  // 2. Client DB + schema create karo
  const clientPool = await createClientDatabase(dbName);

  // 3. Default admin user banao
  const tempPassword = `Solar@${Math.floor(1000 + Math.random() * 9000)}`;
  const hashedPass   = await bcrypt.hash(tempPassword, 10);

  const username = subdomain; // subdomain hi username hoga
  await clientPool.query(
    `INSERT INTO users (role_id, full_name, username, email, phone, password, status)
     VALUES (1, ?, ?, ?, ?, ?, 'Active')`,
    [ownerName, username, email, phone, hashedPass]
  );

  // Company settings seed karo
  await clientPool.query(
    `INSERT INTO settings (company_name, company_email, company_phone)
     VALUES (?, ?, ?)`,
    [businessName, email, phone]
  );

  // 4. Subscription history mein entry
  const [planRows] = await masterDb.query(
    `SELECT price_monthly FROM plans WHERE id = ? LIMIT 1`, [planId]
  );
  const amount = planRows[0]?.price_monthly * durationMonths || 0;

  await masterDb.query(
    `INSERT INTO subscription_history
      (client_id, plan_id, amount_paid, start_date, end_date, renewed_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [clientId, planId, amount, toDateStr(start), toDateStr(end), createdBy]
  );

  // 5. Welcome email bhejo
  const [planInfo] = await masterDb.query(
    `SELECT name FROM plans WHERE id = ? LIMIT 1`, [planId]
  );
  try {
    await sendSubscriptionEmail("Welcome", {
      owner_name:       ownerName,
      email:            email,
      subdomain:        subdomain,
      plan_name:        planInfo[0]?.name,
      subscription_end: toDateStr(end),
    }, { tempPassword });
  } catch (emailErr) {
    console.error("Welcome email failed (non-fatal):", emailErr.message);
  }

  return {
    clientId,
    clientCode,
    dbName,
    subdomain,
    tempPassword,
    subscriptionEnd: toDateStr(end),
  };
}

module.exports = { provisionNewClient };
