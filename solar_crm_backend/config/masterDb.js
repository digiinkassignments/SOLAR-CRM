// ============================================================
// MASTER DB CONNECTION
// db_digiink_master se connect karta hai
// Client DBs ke liye alag file hai: clientDb.js
// ============================================================

const mysql = require("mysql2");
require("dotenv").config();

const masterDb = mysql.createPool({
  host:     process.env.MASTER_DB_HOST || process.env.DB_HOST,
  user:     process.env.MASTER_DB_USER || process.env.DB_USER,
  password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD,
  database: "db_digiink_master",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}).promise();

async function connectMasterDB() {
  try {
    const conn = await masterDb.getConnection();
    console.log("Master DB Connected (db_digiink_master)");
    conn.release();
  } catch (err) {
    console.error("Master DB Connection Failed:", err.message);
    process.exit(1);
  }
}

module.exports = { masterDb, connectMasterDB };
