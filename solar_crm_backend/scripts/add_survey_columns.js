const mysql = require("mysql2/promise");

async function run() {
  const conn = await mysql.createConnection({ host: "localhost", user: "digiink", password: "Root@123" });
  for (const db of ["db_client_001", "db_client_002", "solar_crm"]) {
    const addCol = async (colDef) => {
      try {
        await conn.query(`ALTER TABLE ${db}.site_surveys ADD COLUMN ${colDef}`);
      } catch (e) {
        // column may already exist
      }
    };
    await addCol("is_approved TINYINT(1) DEFAULT 0");
    await addCol("approved_by INT NULL");
    await addCol("approved_at DATETIME NULL");
    await addCol("project_id INT NULL");
    console.log(`${db} site_surveys columns verified`);
  }
  await conn.end();
}

run().catch(console.error);

