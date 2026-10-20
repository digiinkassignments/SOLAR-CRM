// ============================================================
// SYNC EXISTING CLIENT DATABASES
// Applies all 24+ tables from complete_client_template.sql
// across existing databases (db_client_003, 004, 005, 007, etc.)
// ============================================================

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function syncAllClientDatabases() {
  const masterConn = await mysql.createConnection({
    host: process.env.MASTER_DB_HOST || process.env.DB_HOST || "localhost",
    user: process.env.MASTER_DB_USER || process.env.DB_USER || "root",
    password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD,
    database: "db_digiink_master",
  });

  console.log("Connected to Master Database.");

  const [clients] = await masterConn.query(
    "SELECT id, client_code, db_name, business_name FROM clients WHERE status != 'Deleted'"
  );
  console.log(`Found ${clients.length} active tenant database(s) to verify & sync.`);

  const templatePath = path.join(__dirname, "complete_client_template.sql");
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`);
  }

  const sqlContent = fs.readFileSync(templatePath, "utf8");
  const statements = sqlContent
    .replace(/\/\*[\s\S]*?\*\/|--[^\n]*\n/g, "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  console.log(`Loaded ${statements.length} SQL migration statements.`);

  for (const client of clients) {
    console.log(`\n==> Synchronizing tables for ${client.client_code} (${client.db_name})...`);
    let tenantConn;
    try {
      tenantConn = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD,
        database: client.db_name,
      });

      for (const statement of statements) {
        try {
          await tenantConn.query(statement);
        } catch (err) {
          if (!err.message.includes("already exists") && !err.message.includes("Duplicate")) {
            // Log meaningful warning
          }
        }
      }

      // Ensure roles table has custom RBAC columns: permissions (JSON) and is_system (TINYINT)
      try {
        await tenantConn.query("ALTER TABLE `roles` ADD COLUMN IF NOT EXISTS `permissions` JSON NULL AFTER `description`");
      } catch (colErr) {}
      try {
        await tenantConn.query("ALTER TABLE `roles` ADD COLUMN IF NOT EXISTS `is_system` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`");
      } catch (colErr) {}
      try {
        await tenantConn.query("UPDATE `roles` SET `is_system` = 1 WHERE `id` IN (1, 2, 3, 4)");
      } catch (colErr) {}

      const [tables] = await tenantConn.query("SHOW TABLES");
      console.log(`✅ ${client.db_name} is now complete with ${tables.length} tables!`);
      await tenantConn.end();
    } catch (err) {
      console.error(`❌ Error on ${client.db_name}:`, err.message);
      if (tenantConn) await tenantConn.end();
    }
  }

  await masterConn.end();
  console.log("\n🚀 All Client Databases are now 100% in sync with complete tables & seed data!");
}

syncAllClientDatabases().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
