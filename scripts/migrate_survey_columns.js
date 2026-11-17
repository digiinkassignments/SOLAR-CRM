const mysql = require('mysql2/promise');

async function migrateDb(dbName) {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'digiink',
    password: 'Root@123',
    database: dbName
  });

  const cols = [
    ['site_surveys', 'consumer_number', 'VARCHAR(50) NULL'],
    ['site_surveys', 'feasibility_verdict', "VARCHAR(50) DEFAULT 'Feasible'"],
    ['site_surveys', 'not_feasible_reason', 'VARCHAR(255) NULL'],
    ['site_surveys', 'lead_action_on_not_feasible', 'VARCHAR(50) NULL'],
    ['site_surveys', 'feasibility_notes', 'TEXT NULL'],
    ['site_surveys', 'roof_orientation', "VARCHAR(50) DEFAULT 'South'"],
    ['site_surveys', 'roof_tilt_angle', 'DECIMAL(5,2) NULL'],
    ['site_surveys', 'roof_ownership', "VARCHAR(100) DEFAULT 'Self-Owned'"],
    ['site_surveys', 'noc_status', "VARCHAR(50) DEFAULT 'NOC Not Required'"],
    ['site_surveys', 'proposed_capacity_kw', 'DECIMAL(8,2) NULL'],
    ['leads', 'consumer_number', 'VARCHAR(50) NULL']
  ];

  for (const [table, col, def] of cols) {
    try {
      await db.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
      console.log(`[${dbName}] Added ${col} to ${table}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`[${dbName}] ${col} already exists in ${table}`);
      } else {
        console.error(`[${dbName}] Error adding ${col} to ${table}:`, e.message);
      }
    }
  }
  await db.end();
}

(async () => {
  const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['db_client_001', 'db_client_002', 'solar_crm'];
  for (const t of targets) {
    await migrateDb(t);
  }
  console.log('Migration completed successfully.');
  process.exit(0);
})().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
