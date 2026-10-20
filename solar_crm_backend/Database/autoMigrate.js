// ============================================================
// AUTO MIGRATION RUNNER (Enterprise Multi-Tenant Pattern)
// Runs on server startup:
// 1. Tracks applied migrations in `schema_migrations` table
// 2. Automatically runs any new .sql or .js file across ALL tenant DBs
// 3. Zero manual intervention required when you add new tables!
// ============================================================

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function autoMigrateAllTenants() {
  const migrationsDir = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  // Find all migration files sorted by name (e.g. 001_..., 002_...)
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") || f.endsWith(".js"))
    .sort();

  if (migrationFiles.length === 0) {
    return;
  }

  let masterConn;
  let targetDbs = [];

  try {
    masterConn = await mysql.createConnection({
      host: process.env.MASTER_DB_HOST || process.env.DB_HOST || "localhost",
      user: process.env.MASTER_DB_USER || process.env.DB_USER || "root",
      password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD,
      database: "db_digiink_master",
    });

    // Fetch all active tenants
    const [clients] = await masterConn.query(
      "SELECT id, client_code, db_name FROM clients WHERE status != 'Deleted'"
    );
    const tenantList = clients.map((c) => c.db_name);
    const defaultDb = process.env.DB_NAME || "solar_crm";
    targetDbs = Array.from(new Set([defaultDb, ...tenantList]));
  } catch (mErr) {
    // If master DB is not used (local standalone dev), migrate default DB
    const defaultDb = process.env.DB_NAME || "solar_crm";
    targetDbs = [defaultDb];
  }

  for (const dbName of targetDbs) {
    let tenantConn;
    try {
      tenantConn = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD,
        database: dbName,
      });

      // 1. Ensure schema_migrations tracker table exists in tenant DB
      await tenantConn.query(`
        CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`migration_name\` VARCHAR(255) NOT NULL UNIQUE,
          \`applied_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 2. Check already applied migrations
      const [appliedRows] = await tenantConn.query(
        "SELECT migration_name FROM schema_migrations"
      );
      const appliedSet = new Set(appliedRows.map((r) => r.migration_name));

      // 3. Run pending migrations
      for (const file of migrationFiles) {
        if (!appliedSet.has(file)) {
          console.log(`[Auto-Migration] Applying ${file} to ${dbName}...`);
          const filePath = path.join(migrationsDir, file);

          if (file.endsWith(".sql")) {
            const content = fs.readFileSync(filePath, "utf8");
            const statements = content
              .replace(/\/\*[\s\S]*?\*\/|--[^\n]*\n/g, "")
              .split(";")
              .map((s) => s.trim())
              .filter((s) => s.length > 5);

            for (const stmt of statements) {
              try {
                await tenantConn.query(stmt);
              } catch (e) {
                if (
                  !e.message.includes("already exists") &&
                  !e.message.includes("Duplicate")
                ) {
                  console.warn(`[Auto-Migration Note in ${dbName}]:`, e.message);
                }
              }
            }
          } else if (file.endsWith(".js")) {
            const migrationModule = require(filePath);
            if (typeof migrationModule.up === "function") {
              await migrationModule.up(tenantConn);
            }
          }

          // Record as applied
          await tenantConn.query(
            "INSERT IGNORE INTO schema_migrations (migration_name) VALUES (?)",
            [file]
          );
          console.log(`[Auto-Migration] ✓ ${file} applied to ${dbName}`);
        }
      }

      await tenantConn.end();
    } catch (tenantErr) {
      console.error(`[Auto-Migration Error on ${dbName}]:`, tenantErr.message);
      if (tenantConn) await tenantConn.end();
    }
  }

  if (masterConn) {
    try {
      await masterConn.end();
    } catch (e) {}
  }
}

module.exports = { autoMigrateAllTenants };
