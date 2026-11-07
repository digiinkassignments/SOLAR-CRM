const mysql = require("mysql2/promise");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

async function runMigration() {
  const dbUser = process.env.DB_USER || "digiink";
  const dbPass = process.env.DB_PASSWORD || "Root@123";
  const dbHost = process.env.DB_HOST || "localhost";

  const conn = await mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPass,
  });

  const [dbs] = await conn.query("SHOW DATABASES LIKE 'db_client_%'");
  const dbNames = dbs.map((row) => Object.values(row)[0]);

  const tables = [
    "project_inspections",
    "project_commissioning",
    "project_final_inspection",
    "project_handover",
    "installation_logs",
  ];

  for (const dbName of dbNames) {
    console.log(`Checking DB: ${dbName}`);
    for (const table of tables) {
      try {
        const [cols] = await conn.query(
          `SHOW COLUMNS FROM \`${dbName}\`.\`${table}\` LIKE 'signature_data'`
        );
        if (cols.length === 0) {
          await conn.query(
            `ALTER TABLE \`${dbName}\`.\`${table}\` ADD COLUMN signature_data LONGTEXT DEFAULT NULL`
          );
          console.log(`  + Added signature_data to ${table} in ${dbName}`);
        } else {
          console.log(`  = signature_data already exists in ${table} (${dbName})`);
        }
      } catch (err) {
        console.warn(`  ! Skipped ${table} in ${dbName}: ${err.message}`);
      }
    }
  }

  await conn.end();
  console.log("Migration complete!");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
