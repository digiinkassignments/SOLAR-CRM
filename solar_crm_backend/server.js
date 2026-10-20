// ============================================================
// SERVER.JS — UPDATED
// Changes from original:
// 1. connectMasterDB() add kiya
// 2. startSubscriptionCrons() add kiya
// 3. Baaki sab same
// ============================================================

require("dotenv").config();

const app = require("./app");
const { connectDB }               = require("./config/db");            // existing
const { connectMasterDB }         = require("./config/masterDb");      // NEW
const { startScheduledNotifications } = require("./services/scheduledNotifications"); // existing
const { startSubscriptionCrons }  = require("./services/subscriptionCron"); // NEW
const { autoMigrateAllTenants }   = require("./Database/autoMigrate"); // Auto Sync All Clients

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Existing client DB connect (original wala)
  await connectDB();

  // 2. NEW — Master DB connect
  await connectMasterDB();

  // 3. Auto-Migrate: Sync any new tables/columns across ALL client DBs automatically
  try {
    await autoMigrateAllTenants();
  } catch (migErr) {
    console.error("Auto-migration non-fatal error on startup:", migErr.message);
  }

  // 4. Start server
  app.listen(PORT, () => {
    console.log(`Solar CRM Server running on port ${PORT}`);
  });

  // 5. Existing cron jobs
  startScheduledNotifications();

  // 6. NEW — Subscription cron jobs
  startSubscriptionCrons();
};

startServer();
