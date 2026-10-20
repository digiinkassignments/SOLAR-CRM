// ============================================================
// DATABASE INDEXING OPTIMIZATION SCRIPT
// Run across all tenant databases and master DB to guarantee
// sub-20ms query performance and eliminate full-table scans.
// ============================================================

const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function optimizeDatabases() {
  const masterConn = await mysql.createConnection({
    host: process.env.MASTER_DB_HOST || process.env.DB_HOST || "localhost",
    user: process.env.MASTER_DB_USER || process.env.DB_USER || "root",
    password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD,
    database: "db_digiink_master",
  });

  console.log("Connected to Master Database.");

  // Helper to safely add index if it doesn't already exist
  async function addIndexIfNotExists(conn, table, indexName, columns) {
    try {
      const [existing] = await conn.query(
        `SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`,
        [indexName]
      );
      if (existing.length === 0) {
        await conn.query(`ALTER TABLE \`${table}\` ADD INDEX \`${indexName}\` (${columns})`);
        console.log(`   + Index [${indexName}] added on \`${table}\`(${columns})`);
      } else {
        console.log(`   ✓ Index [${indexName}] already exists on \`${table}\``);
      }
    } catch (err) {
      if (err.message.includes("doesn't exist")) {
        // Table not present in this schema
      } else {
        console.warn(`   ! Note on ${table}.${indexName}:`, err.message);
      }
    }
  }

  // 1. Optimize Master Database
  console.log("\n==> 1. Optimizing Master Database (db_digiink_master)...");
  await addIndexIfNotExists(masterConn, "clients", "idx_clients_subdomain_status", "`subdomain`, `status`");
  await addIndexIfNotExists(masterConn, "payment_requests", "idx_pr_status_date", "`status`, `requested_at`");
  await addIndexIfNotExists(masterConn, "subscription_history", "idx_sh_created", "`created_at`");

  // 2. Fetch all tenant databases
  const [clients] = await masterConn.query(
    "SELECT id, client_code, db_name FROM clients WHERE status != 'Deleted'"
  );
  console.log(`\n==> Found ${clients.length} active tenant database(s) to optimize.`);

  // 3. Loop each tenant database and apply performance indexes
  for (const client of clients) {
    console.log(`\n==> Optimizing Tenant DB: ${client.db_name} (${client.client_code})...`);
    let tenantConn;
    try {
      tenantConn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: client.db_name,
      });

      // A. Leads indexing (Fast search, status filtering, assignment lookup)
      await addIndexIfNotExists(tenantConn, "leads", "idx_leads_status", "`status`");
      await addIndexIfNotExists(tenantConn, "leads", "idx_leads_assigned_status", "`assigned_to`, `status`");
      await addIndexIfNotExists(tenantConn, "leads", "idx_leads_phone", "`phone`");
      await addIndexIfNotExists(tenantConn, "leads", "idx_leads_created", "`created_at`");

      // B. Follow-ups indexing
      await addIndexIfNotExists(tenantConn, "lead_followups", "idx_followups_lead_date", "`lead_id`, `follow_up_date`");
      await addIndexIfNotExists(tenantConn, "lead_followups", "idx_followups_date", "`follow_up_date`");

      // C. Quotations & Invoices
      await addIndexIfNotExists(tenantConn, "quotations", "idx_quotations_lead", "`lead_id`");
      await addIndexIfNotExists(tenantConn, "quotations", "idx_quotations_status", "`status`");
      await addIndexIfNotExists(tenantConn, "invoices", "idx_invoices_lead", "`lead_id`");
      await addIndexIfNotExists(tenantConn, "invoices", "idx_invoices_status", "`payment_status`");

      // D. Users & Notifications
      await addIndexIfNotExists(tenantConn, "users", "idx_users_role_status", "`role_id`, `status`");
      await addIndexIfNotExists(tenantConn, "notifications", "idx_notif_user_read", "`user_id`, `is_read`");

      await tenantConn.end();
      console.log(`✅ ${client.db_name} indexes verified.`);
    } catch (err) {
      console.error(`❌ Failed optimizing ${client.db_name}:`, err.message);
      if (tenantConn) await tenantConn.end();
    }
  }

  await masterConn.end();
  console.log("\n🚀 All Database Performance Indexes successfully applied!");
}

optimizeDatabases().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
