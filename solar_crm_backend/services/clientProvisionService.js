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

const fs     = require("fs");
const path   = require("path");
const { exec } = require("child_process");
const util   = require("util");
const execAsync = util.promisify(exec);
const bcrypt = require("bcrypt");
const crypto = require("crypto");
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
// Create Client Database + Install Solar CRM Schema (All 62 Tables)
// ============================================================
async function createClientDatabase(dbName, strict = false) {
  // 1. DB create karo
  await mysql.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  // 2. Install Full 62 Solar CRM Tables & Configuration Seeds from solar_crm_master_template.sql
  const templatePath = path.join(__dirname, "../Database/solar_crm_master_template.sql");
  if (strict) {
    if (!fs.existsSync(templatePath)) throw new Error('Tenant schema template unavailable');
    const connection = await require('mysql2/promise').createConnection({
      host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
      database: dbName, multipleStatements: true,
    });
    try { await connection.query(fs.readFileSync(templatePath, 'utf8')); }
    finally { await connection.end(); }
    return getClientPool(dbName);
  }
  if (fs.existsSync(templatePath)) {
    const host = process.env.DB_HOST || "localhost";
    const user = process.env.DB_USER || "root";
    const passArg = process.env.DB_PASSWORD ? `-p"${process.env.DB_PASSWORD}"` : "";
    const importCmd = `mysql -h ${host} -u ${user} ${passArg} "${dbName}" < "${templatePath}"`;
    try {
      await execAsync(importCmd);
      console.log(`✅ All 62 Solar CRM tables and seeds auto-migrated into ${dbName}`);
    } catch (importErr) {
      console.error(`CLI import fallback for ${dbName}:`, importErr.message);
      const sqlContent = fs.readFileSync(templatePath, "utf8");
      const clientPool = getClientPool(dbName);
      const statements = sqlContent
        .replace(/\/\*[\s\S]*?\*\/|--[^\n]*\n/g, "")
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 5);
      for (const stmt of statements) {
        try {
          await clientPool.query(stmt);
        } catch (e) {
          // ignore duplicate
        }
      }
    }
  }

  const clientPool = getClientPool(dbName);
  return clientPool;
}

// ============================================================
// MAIN FUNCTION: provisionNewClient
// Super Admin controller se call hoga
// ============================================================
async function provisionUnlocked({
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
  trialOptions = null,
}) {
  const clientCode = await generateClientCode();
  const dbName     = generateDbName(clientCode);

  // Subscription dates calculate karo
  const start     = new Date();
  const end       = new Date();
  if (trialOptions) {
    end.setTime(start.getTime() + 7 * 86400000);
  } else if (durationMonths < 1) {
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

  try {

  // 2. Client DB + schema create karo
  const clientPool = await createClientDatabase(dbName, Boolean(trialOptions));

  // Public signup must never import legacy self-running, all-tenant migrations.
  if (trialOptions) {
    await require('../services/portalRoles').ensurePortalRoles(clientPool);
  } else {
    try {
      const { autoMigrateAllTenants } = require('../Database/autoMigrate');
      await autoMigrateAllTenants();
    } catch (mErr) {
      console.warn('Auto-migrate warning for new tenant:', mErr.message);
    }
  }

  // 3. Default admin user banao
  const tempPassword = trialOptions ? `Solops!${crypto.randomBytes(18).toString("base64url")}` : `Solar@${Math.floor(1000 + Math.random() * 9000)}`;
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
  const amount = trialOptions ? 0 : planRows[0]?.price_monthly * durationMonths || 0;

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
    if (!trialOptions) await sendSubscriptionEmail("Welcome", {
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
    trialEndAt: trialOptions ? end.toISOString() : null,
  };
  } catch (error) {
    if (trialOptions) {
      await masterDb.query("UPDATE clients SET status='Locked',notes='Website trial setup failed; support review required.' WHERE id=?",[clientId]).catch(()=>{});
      error.clientId=clientId;
    }
    throw error;
  }
}

// Serialize manual and public provisioning so generated client/database codes cannot collide.
async function provisionNewClient(input) {
  const connection = await masterDb.getConnection();
  try {
    const [[lock]] = await connection.query("SELECT GET_LOCK('solops-client-provision', 20) AS acquired");
    if (Number(lock.acquired) !== 1) throw new Error('Workspace setup is busy. Please retry shortly.');
    return await provisionUnlocked(input);
  } finally {
    await connection.query("SELECT RELEASE_LOCK('solops-client-provision')").catch(()=>{});
    connection.release();
  }
}
module.exports = { provisionNewClient };
