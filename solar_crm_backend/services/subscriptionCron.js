// ============================================================
// SUBSCRIPTION CRON JOBS
// server.js mein startSubscriptionCrons() call karo
//
// Daily Jobs:
// 10:00 AM → 7-din expiry warning email
// 10:30 AM → Status update: Active → Expiring Soon
// 11:00 AM → Status update: Expiring → Grace Period (Day 0)
// 11:30 AM → Status update: Grace → Locked (Day 3)
// 12:00 PM → Day 18 warning email (deletion 2 din mein)
// 12:30 PM → Delete clients (Day 20, still unpaid)
// ============================================================

const cron   = require("node-cron");
const { masterDb } = require("../config/masterDb");
const { sendSubscriptionEmail } = require("./subscriptionEmailService");
const mysql = require("mysql2").createPool({
  // Sirf DB drop/create ke liye root connection
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 2,
}).promise();

// ============================================================
// HELPER: Email log save karo
// ============================================================
async function logEmail(clientId, emailType, sentTo, status, errorMsg = null) {
  try {
    await masterDb.query(
      `INSERT INTO email_logs (client_id, email_type, sent_to, status, error_msg)
       VALUES (?, ?, ?, ?, ?)`,
      [clientId, emailType, sentTo, status, errorMsg]
    );
  } catch (e) {
    console.error("Email log save failed:", e.message);
  }
}

// ============================================================
// HELPER: Client DB delete karo (poora database drop)
// ============================================================
async function dropClientDatabase(dbName) {
  try {
    await mysql.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`🗑️ Database dropped: ${dbName}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to drop database ${dbName}:`, err.message);
    return false;
  }
}

// ============================================================
// JOB 1 — 10:00 AM Daily
// Status update: Active → Expiring Soon (7 din ya kam bache)
// ============================================================
const updateExpiringSoon = async () => {
  try {
    const [result] = await masterDb.query(
      `UPDATE clients
       SET status = 'Expiring Soon'
       WHERE status = 'Active'
         AND DATEDIFF(subscription_end, CURDATE()) BETWEEN 0 AND 7`
    );
    if (result.affectedRows > 0) {
      console.log(`⏰ ${result.affectedRows} clients marked as Expiring Soon`);
    }
  } catch (err) {
    console.error("updateExpiringSoon error:", err.message);
  }
};

// ============================================================
// JOB 2 — 10:15 AM Daily
// "Expiring Soon" clients ko warning email bhejo (sirf ek baar — 7 din wale)
// ============================================================
const sendExpiryWarningEmails = async () => {
  try {
    // Exactly 7 din baad expire hone wale + aaj tak email nahi gaya
    const [clients] = await masterDb.query(
      `SELECT c.id, c.client_code, c.business_name, c.owner_name,
              c.email, c.subdomain, c.subscription_end, p.name AS plan_name
       FROM clients c
       JOIN plans p ON c.plan_id = p.id
       WHERE c.status = 'Expiring Soon'
         AND DATEDIFF(c.subscription_end, CURDATE()) = 7
         AND c.id NOT IN (
           SELECT client_id FROM email_logs
           WHERE email_type = 'Expiring Soon'
             AND DATE(sent_at) = CURDATE()
         )`
    );

    for (const client of clients) {
      try {
        await sendSubscriptionEmail("Expiring Soon", client);
        await logEmail(client.id, "Expiring Soon", client.email, "Sent");
      } catch (e) {
        await logEmail(client.id, "Expiring Soon", client.email, "Failed", e.message);
      }
    }

    if (clients.length > 0) {
      console.log(`📧 Expiry warning emails sent to ${clients.length} clients`);
    }
  } catch (err) {
    console.error("sendExpiryWarningEmails error:", err.message);
  }
};

// ============================================================
// JOB 3 — 11:00 AM Daily
// Status update: Expiring Soon / Active → Grace Period (expiry date aaj ya pehle)
// ============================================================
const updateGracePeriod = async () => {
  try {
    const [result] = await masterDb.query(
      `UPDATE clients
       SET status = 'Grace Period'
       WHERE status IN ('Active', 'Expiring Soon')
         AND subscription_end < CURDATE()`
    );

    if (result.affectedRows > 0) {
      console.log(`⚠️ ${result.affectedRows} clients moved to Grace Period`);

      // Grace period start email bhejo
      const [graceClients] = await masterDb.query(
        `SELECT c.id, c.client_code, c.business_name, c.owner_name,
                c.email, c.subdomain, c.grace_end_date, p.name AS plan_name
         FROM clients c
         JOIN plans p ON c.plan_id = p.id
         WHERE c.status = 'Grace Period'
           AND c.id NOT IN (
             SELECT client_id FROM email_logs
             WHERE email_type = 'Grace Period Started'
               AND DATE(sent_at) = CURDATE()
           )`
      );

      for (const client of graceClients) {
        try {
          await sendSubscriptionEmail("Grace Period Started", client);
          await logEmail(client.id, "Grace Period Started", client.email, "Sent");
        } catch (e) {
          await logEmail(client.id, "Grace Period Started", client.email, "Failed", e.message);
        }
      }
    }
  } catch (err) {
    console.error("updateGracePeriod error:", err.message);
  }
};

// ============================================================
// JOB 4 — 11:30 AM Daily
// Status update: Grace Period → Locked (grace_end_date aaj ya pehle)
// ============================================================
const lockExpiredClients = async () => {
  try {
    const [toLock] = await masterDb.query(
      `SELECT c.id, c.client_code, c.business_name, c.owner_name,
              c.email, c.subdomain, p.name AS plan_name
       FROM clients c
       JOIN plans p ON c.plan_id = p.id
       WHERE c.status = 'Grace Period'
         AND c.grace_end_date < CURDATE()`
    );

    if (toLock.length === 0) return;

    const ids = toLock.map(c => c.id);
    await masterDb.query(
      `UPDATE clients SET status = 'Locked' WHERE id IN (?)`,
      [ids]
    );
    console.log(`🔒 ${toLock.length} clients locked`);

    for (const client of toLock) {
      try {
        await sendSubscriptionEmail("Account Locked", client);
        await logEmail(client.id, "Account Locked", client.email, "Sent");
      } catch (e) {
        await logEmail(client.id, "Account Locked", client.email, "Failed", e.message);
      }
    }
  } catch (err) {
    console.error("lockExpiredClients error:", err.message);
  }
};

// ============================================================
// JOB 5 — 12:00 PM Daily
// Day 18 warning email — "2 din mein data delete ho jayega"
// ============================================================
const sendDeletionWarningEmails = async () => {
  try {
    const [clients] = await masterDb.query(
      `SELECT c.id, c.client_code, c.business_name, c.owner_name,
              c.email, c.subdomain, c.delete_date, p.name AS plan_name
       FROM clients c
       JOIN plans p ON c.plan_id = p.id
       WHERE c.status = 'Locked'
         AND DATEDIFF(c.delete_date, CURDATE()) = 2
         AND c.id NOT IN (
           SELECT client_id FROM email_logs
           WHERE email_type = 'Deletion Warning'
             AND DATE(sent_at) = CURDATE()
         )`
    );

    for (const client of clients) {
      try {
        await sendSubscriptionEmail("Deletion Warning", client);
        await logEmail(client.id, "Deletion Warning", client.email, "Sent");
      } catch (e) {
        await logEmail(client.id, "Deletion Warning", client.email, "Failed", e.message);
      }
    }

    if (clients.length > 0) {
      console.log(`⚠️ Deletion warning sent to ${clients.length} clients`);
    }
  } catch (err) {
    console.error("sendDeletionWarningEmails error:", err.message);
  }
};

// ============================================================
// JOB 6 — 12:30 PM Daily
// Auto Delete — Locked + delete_date aaj ya pehle
// DB drop karo + status = 'Deleted'
// ============================================================
const deleteExpiredClients = async () => {
  try {
    const [toDelete] = await masterDb.query(
      `SELECT c.id, c.client_code, c.business_name, c.owner_name,
              c.email, c.db_name, c.subdomain, p.name AS plan_name
       FROM clients c
       JOIN plans p ON c.plan_id = p.id
       WHERE c.status = 'Locked'
         AND c.delete_date <= CURDATE()`
    );

    if (toDelete.length === 0) return;

    for (const client of toDelete) {
      // 1. DB drop karo
      const dropped = await dropClientDatabase(client.db_name);

      // 2. Status update
      await masterDb.query(
        `UPDATE clients SET status = 'Deleted' WHERE id = ?`,
        [client.id]
      );

      // 3. Email
      try {
        await sendSubscriptionEmail("Account Deleted", client);
        await logEmail(client.id, "Account Deleted", client.email, "Sent");
      } catch (e) {
        await logEmail(client.id, "Account Deleted", client.email, "Failed", e.message);
      }

      console.log(`🗑️ Client deleted: ${client.client_code} — ${client.business_name}`);
    }
  } catch (err) {
    console.error("deleteExpiredClients error:", err.message);
  }
};

// ============================================================
// START ALL CRONS
// server.js mein: startSubscriptionCrons() call karo
// ============================================================
const startSubscriptionCrons = () => {
  // 10:00 AM — Expiring Soon status update
  cron.schedule("0 10 * * *", updateExpiringSoon, { timezone: "Asia/Kolkata" });

  // 10:15 AM — 7-din expiry warning email
  cron.schedule("15 10 * * *", sendExpiryWarningEmails, { timezone: "Asia/Kolkata" });

  // 11:00 AM — Grace Period start
  cron.schedule("0 11 * * *", updateGracePeriod, { timezone: "Asia/Kolkata" });

  // 11:30 AM — Lock clients
  cron.schedule("30 11 * * *", lockExpiredClients, { timezone: "Asia/Kolkata" });

  // 12:00 PM — Deletion warning (Day 18)
  cron.schedule("0 12 * * *", sendDeletionWarningEmails, { timezone: "Asia/Kolkata" });

  // 12:30 PM — Auto delete (Day 20)
  cron.schedule("30 12 * * *", deleteExpiredClients, { timezone: "Asia/Kolkata" });

  console.log("Subscription cron jobs started (IST timezone)");
};

module.exports = { startSubscriptionCrons };
