const mysql = require("mysql2/promise");
const crypto = require("crypto");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

async function runMigration() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "digiink",
    password: process.env.DB_PASSWORD || "Root@123",
  });

  console.log("Connected to MySQL for 011_add_project_uuid migration...");

  // Find all client databases + default solar_crm
  const [dbs] = await conn.query("SHOW DATABASES LIKE 'db_client_%'");
  const clientDbNames = dbs.map((r) => Object.values(r)[0]);
  clientDbNames.push("solar_crm");

  for (const dbName of clientDbNames) {
    console.log(`Checking DB: ${dbName}`);
    try {
      // Check if projects table exists
      const [tblCheck] = await conn.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects'`,
        [dbName]
      );
      if (tblCheck.length === 0) {
        console.log(`  - No projects table in ${dbName}, skipping.`);
        continue;
      }

      // Check if project_uuid column exists
      const [cols] = await conn.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects'`,
        [dbName]
      );
      const colNames = cols.map((c) => c.COLUMN_NAME);

      if (!colNames.includes("project_uuid")) {
        console.log(`  + Adding project_uuid to projects in ${dbName}...`);
        await conn.query(`ALTER TABLE \`${dbName}\`.projects ADD COLUMN project_uuid VARCHAR(64) UNIQUE DEFAULT NULL AFTER project_number`);
      }

      // Populate any null project_uuid
      const [projectsWithoutUuid] = await conn.query(
        `SELECT id, project_number FROM \`${dbName}\`.projects WHERE project_uuid IS NULL OR project_uuid = ''`
      );

      for (const p of projectsWithoutUuid) {
        const secureUuid = `PRJ-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
        await conn.query(
          `UPDATE \`${dbName}\`.projects SET project_uuid = ? WHERE id = ?`,
          [secureUuid, p.id]
        );
        console.log(`  ✓ Assigned ${secureUuid} to project #${p.id} (${p.project_number}) in ${dbName}`);
      }

    } catch (err) {
      console.error(`Error in DB ${dbName}:`, err.message);
    }
  }

  await conn.end();
  console.log("Migration 011_add_project_uuid complete!");
}

if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = runMigration;
