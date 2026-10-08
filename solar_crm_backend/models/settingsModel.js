const { db: defaultDb } = require("../config/db");

// ======================================
// Get Settings
// ======================================
const getSettings = async (db = defaultDb) => {
    try {
        const [existing] = await db.query(`SHOW COLUMNS FROM settings`);
        const colNames = existing.map(c => c.Field);
        const toAdd = [
            { name: "quotation_template", sql: "ADD COLUMN quotation_template VARCHAR(50) DEFAULT 'template1'" },
            { name: "bank_name", sql: "ADD COLUMN bank_name VARCHAR(150) DEFAULT NULL" },
            { name: "account_name", sql: "ADD COLUMN account_name VARCHAR(150) DEFAULT NULL" },
            { name: "account_number", sql: "ADD COLUMN account_number VARCHAR(100) DEFAULT NULL" },
            { name: "ifsc_code", sql: "ADD COLUMN ifsc_code VARCHAR(50) DEFAULT NULL" },
            { name: "branch_name", sql: "ADD COLUMN branch_name VARCHAR(150) DEFAULT NULL" },
            { name: "upi_id", sql: "ADD COLUMN upi_id VARCHAR(100) DEFAULT NULL" }
        ];
        for (const item of toAdd) {
            if (!colNames.includes(item.name)) {
                await db.query(`ALTER TABLE settings ${item.sql}`).catch(() => {});
            }
        }
    } catch (e) {
        console.error("Column check notice in getSettings:", e.message);
    }

    const [rows] = await db.query(`
        SELECT *
        FROM settings
        LIMIT 1
    `);
    if (rows.length === 0) {
        return [{
            id: 1,
            company_name: "Solar CRM Partner",
            company_email: "support@solarcrm.com",
            company_phone: "+91 98765 43210",
            quotation_template: "template1"
        }];
    }
    return rows;
};

// ======================================
// Update Settings (Dynamic Column Matching)
// ======================================
const updateSettings = async (data, db = defaultDb) => {
    // 1. Get existing columns in MySQL settings table
    let existingColumns = [];
    try {
        const [columnsResult] = await db.query(`SHOW COLUMNS FROM settings`);
        existingColumns = columnsResult.map(col => col.Field);
    } catch (e) {
        console.error("Error fetching table columns:", e.message);
    }

    // 2. Auto-add quotation_template and bank columns if they don't exist yet
    const colsToAdd = [
        { name: "quotation_template", sql: "ADD COLUMN quotation_template VARCHAR(50) DEFAULT 'template1'" },
        { name: "bank_name", sql: "ADD COLUMN bank_name VARCHAR(150) DEFAULT NULL" },
        { name: "account_name", sql: "ADD COLUMN account_name VARCHAR(150) DEFAULT NULL" },
        { name: "account_number", sql: "ADD COLUMN account_number VARCHAR(100) DEFAULT NULL" },
        { name: "ifsc_code", sql: "ADD COLUMN ifsc_code VARCHAR(50) DEFAULT NULL" },
        { name: "branch_name", sql: "ADD COLUMN branch_name VARCHAR(150) DEFAULT NULL" },
        { name: "upi_id", sql: "ADD COLUMN upi_id VARCHAR(100) DEFAULT NULL" }
    ];

    for (const c of colsToAdd) {
        if (!existingColumns.includes(c.name)) {
            try {
                await db.query(`ALTER TABLE settings ${c.sql}`);
                existingColumns.push(c.name);
            } catch (e) {
                console.error(`Error adding ${c.name} column:`, e.message);
            }
        }
    }

    const allowedFields = [
        "company_name", "company_logo", "company_email", "company_phone", "website",
        "gst_number", "pan_number", "address", "city", "state", "country", "pincode",
        "currency", "timezone", "date_format",
        "smtp_host", "smtp_port", "smtp_username", "smtp_password", "smtp_encryption",
        "session_timeout", "password_expiry_days", "otp_length",
        "enable_2fa", "strong_password",
        "email_notifications", "lead_notifications", "weekly_reports", "system_notifications",
        "backup_frequency", "backup_retention_days", "quotation_template",
        "bank_name", "account_name", "account_number", "ifsc_code", "branch_name", "upi_id"
    ];

    // 3. Build dynamic fields & values array using only columns present in DB table
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
        if (existingColumns.includes(field) && data[field] !== undefined) {
            updateFields.push(`${field}=?`);
            updateValues.push(data[field]);
        }
    }

    if (updateFields.length === 0) {
        return { message: "No matching fields to update." };
    }

    const [existing] = await db.query(`SELECT id FROM settings ORDER BY id ASC LIMIT 1`);

    if (existing.length > 0) {
        const targetId = existing[0].id;
        updateValues.push(targetId);
        const [result] = await db.query(
            `UPDATE settings SET ${updateFields.join(", ")} WHERE id=?`,
            updateValues
        );
        return result;
    } else {
        const insertCols = [];
        const insertPlaceholders = [];
        const insertVals = [];

        for (const field of allowedFields) {
            if (existingColumns.includes(field) && data[field] !== undefined) {
                insertCols.push(field);
                insertPlaceholders.push("?");
                insertVals.push(data[field]);
            }
        }

        const [result] = await db.query(
            `INSERT INTO settings (${insertCols.join(", ")}) VALUES (${insertPlaceholders.join(", ")})`,
            insertVals
        );
        return result;
    }
};

// ======================================
// Update Company Logo
// ======================================
const updateCompanyLogo = async (logo, db = defaultDb) => {
    const [existing] = await db.query(`SELECT id FROM settings ORDER BY id ASC LIMIT 1`);

    if (existing.length > 0) {
        const targetId = existing[0].id;
        const [result] = await db.query(
            `
            UPDATE settings
            SET company_logo=?
            WHERE id=?
            `,
            [logo, targetId]
        );
        return result;
    } else {
        const [result] = await db.query(
            `
            INSERT INTO settings (company_name, company_logo)
            VALUES ('Solar CRM Partner', ?)
            `,
            [logo]
        );
        return result;
    }
};

module.exports = {
    getSettings,
    updateSettings,
    updateCompanyLogo
};