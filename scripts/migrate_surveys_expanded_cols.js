const mysql = require('mysql2/promise');

const databases = ['db_client_001', 'db_client_002', 'solar_crm'];

async function migrate() {
  for (const dbName of databases) {
    console.log(`\n--- Migrating database: ${dbName} ---`);
    let conn;
    try {
      conn = await mysql.createConnection({
        host: 'localhost',
        user: 'digiink',
        password: 'Root@123',
        database: dbName
      });

      console.log(`Modifying columns in site_surveys on ${dbName}...`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN shadow_conditions TEXT NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN roof_type VARCHAR(100) NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN electrical_phase VARCHAR(50) NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN roof_orientation VARCHAR(100) NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN roof_ownership VARCHAR(150) NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN noc_status VARCHAR(100) NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN feasibility_verdict VARCHAR(100) NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN not_feasible_reason TEXT NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN lead_action_on_not_feasible VARCHAR(100) NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN gps_latitude DECIMAL(12,8) NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN gps_longitude DECIMAL(12,8) NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN site_latitude DECIMAL(12,8) NULL`);
      await conn.query(`ALTER TABLE site_surveys MODIFY COLUMN site_longitude DECIMAL(12,8) NULL`);

      console.log(`Successfully migrated site_surveys on ${dbName}!`);
    } catch (err) {
      console.error(`Error on ${dbName}:`, err.message);
    } finally {
      if (conn) await conn.end();
    }
  }
}

migrate().then(() => {
  console.log('\nAll database migrations finished.');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

