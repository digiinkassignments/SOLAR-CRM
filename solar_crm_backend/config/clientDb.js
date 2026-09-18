const mysql = require("mysql2");
const { masterDb } = require("./masterDb");

const poolCache = {};

function getClientPool(dbName) {
  if (poolCache[dbName]) {
    return poolCache[dbName];
  }
  const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  }).promise();
  poolCache[dbName] = pool;
  return pool;
}

const clientDbMiddleware = async (req, res, next) => {
  try {
    const host = req.headers.host || "";
    const parts = host.split(".");
    const subdomain = parts[0];
    const reservedSubdomains = ["admin", "www", "api", "localhost", "crm-admin", "solar-crm"];
    const isClientDomain =
      host.includes("solarcrm.local") ||
      host.includes("solarcrm.com") ||
      host.includes("digiinksolutions.com");
    if (!isClientDomain || reservedSubdomains.includes(subdomain)) {
      return next();
    }
    const [rows] = await masterDb.query(
      `SELECT id, client_code, business_name, plan_id,
              db_name, status, subscription_end,
              grace_end_date, delete_date
       FROM clients
       WHERE subdomain = ? AND status != 'Deleted'
       LIMIT 1`,
      [subdomain]
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Client account not found.",
      });
    }
    const client = rows[0];
    req.clientInfo = client;
    req.db = getClientPool(client.db_name);
    const [planRows] = await masterDb.query(
      `SELECT * FROM plans WHERE id = ? LIMIT 1`,
      [client.plan_id]
    );
    req.planFeatures = planRows[0] || null;
    next();
  } catch (err) {
    console.error("clientDbMiddleware error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

module.exports = { clientDbMiddleware, getClientPool };
