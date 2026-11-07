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

  for (const dbName of dbNames) {
    console.log(`Checking DB: ${dbName}`);
    try {
      // 1. Check projects table
      const [pcols] = await conn.query(`SHOW COLUMNS FROM \`${dbName}\`.projects`);
      const existingPCols = new Set(pcols.map((c) => c.Field));

      if (!existingPCols.has("total_cost")) {
        await conn.query(
          `ALTER TABLE \`${dbName}\`.projects ADD COLUMN total_cost DECIMAL(12,2) DEFAULT 0.00`
        );
        console.log(`  + Added total_cost to projects (${dbName})`);
      }
      if (!existingPCols.has("amount_received")) {
        await conn.query(
          `ALTER TABLE \`${dbName}\`.projects ADD COLUMN amount_received DECIMAL(12,2) DEFAULT 0.00`
        );
        console.log(`  + Added amount_received to projects (${dbName})`);
      }
      if (!existingPCols.has("payment_status")) {
        await conn.query(
          `ALTER TABLE \`${dbName}\`.projects ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending'`
        );
        console.log(`  + Added payment_status to projects (${dbName})`);
      }

      // 2. Check project_handover table
      const [hcols] = await conn.query(`SHOW COLUMNS FROM \`${dbName}\`.project_handover`);
      const existingHCols = new Set(hcols.map((c) => c.Field));

      if (!existingHCols.has("contract_value")) {
        await conn.query(
          `ALTER TABLE \`${dbName}\`.project_handover ADD COLUMN contract_value DECIMAL(12,2) DEFAULT NULL`
        );
        console.log(`  + Added contract_value to project_handover (${dbName})`);
      }
      if (!existingHCols.has("amount_paid")) {
        await conn.query(
          `ALTER TABLE \`${dbName}\`.project_handover ADD COLUMN amount_paid DECIMAL(12,2) DEFAULT NULL`
        );
        console.log(`  + Added amount_paid to project_handover (${dbName})`);
      }
      if (!existingHCols.has("balance_due")) {
        await conn.query(
          `ALTER TABLE \`${dbName}\`.project_handover ADD COLUMN balance_due DECIMAL(12,2) DEFAULT NULL`
        );
        console.log(`  + Added balance_due to project_handover (${dbName})`);
      }
      if (!existingHCols.has("payment_status")) {
        await conn.query(
          `ALTER TABLE \`${dbName}\`.project_handover ADD COLUMN payment_status VARCHAR(50) DEFAULT NULL`
        );
        console.log(`  + Added payment_status to project_handover (${dbName})`);
      }
    } catch (err) {
      console.warn(`  ! Error in ${dbName}: ${err.message}`);
    }
  }

  await conn.end();
  console.log("Migration 010 complete!");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

