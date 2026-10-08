const { db: defaultDb } = require("../config/db");

// Auto-ensure subsidy_applications & customer_documents tables exist
const ensureSubsidyTables = async (db = defaultDb) => {
  const sqlSubsidy = `
    CREATE TABLE IF NOT EXISTS subsidy_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_order_id INT DEFAULT NULL,
      lead_id INT NOT NULL,
      consumer_number VARCHAR(50) NOT NULL,
      application_number VARCHAR(50) DEFAULT NULL,
      scheme_name VARCHAR(100) DEFAULT 'PM Surya Ghar Muft Bijli Yojana',
      portal_status VARCHAR(50) DEFAULT 'docs_pending',
      submission_date DATE DEFAULT NULL,
      approval_date DATE DEFAULT NULL,
      subsidy_amount DECIMAL(10, 2) DEFAULT 0,
      portal_notes TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );
  `;
  const sqlDocs = `
    CREATE TABLE IF NOT EXISTS customer_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lead_id INT NOT NULL,
      document_type VARCHAR(50) NOT NULL,
      file_name VARCHAR(255) DEFAULT NULL,
      file_url VARCHAR(255) NOT NULL,
      verification_status VARCHAR(50) DEFAULT 'pending',
      rejection_reason VARCHAR(255) DEFAULT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );
  `;
  try {
    await db.query(sqlSubsidy);
    await db.query(sqlDocs);
  } catch (err) {
    console.error("ensureSubsidyTables error:", err);
  }
};

ensureSubsidyTables().catch(() => {});

// 1. Create or Update Subsidy Application
const applySubsidy = async (data, db = defaultDb) => {
  await ensureSubsidyTables(db);
  const {
    lead_id,
    project_order_id,
    consumer_number,
    application_number,
    scheme_name,
    portal_status,
    submission_date,
    approval_date,
    subsidy_amount,
    portal_notes,
  } = data;

  const parseNum = (val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const subsidyAmt = parseNum(subsidy_amount);
  const orderId = project_order_id && !isNaN(Number(project_order_id)) ? Number(project_order_id) : null;
  const status = portal_status || "docs_pending";

  const [existing] = await db.query(
    `SELECT id FROM subsidy_applications WHERE lead_id = ? LIMIT 1`,
    [lead_id]
  );

  let appId;
  if (existing.length > 0) {
    appId = existing[0].id;
    await db.query(
      `
      UPDATE subsidy_applications SET
        project_order_id = ?,
        consumer_number = ?,
        application_number = ?,
        scheme_name = ?,
        portal_status = ?,
        submission_date = ?,
        approval_date = ?,
        subsidy_amount = ?,
        portal_notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        orderId,
        consumer_number,
        application_number || null,
        scheme_name || "PM Surya Ghar Muft Bijli Yojana",
        status,
        submission_date || null,
        approval_date || null,
        subsidyAmt,
        portal_notes || null,
        appId,
      ]
    );
  } else {
    const [res] = await db.query(
      `
      INSERT INTO subsidy_applications (
        lead_id, project_order_id, consumer_number, application_number,
        scheme_name, portal_status, submission_date, approval_date,
        subsidy_amount, portal_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        lead_id,
        orderId,
        consumer_number,
        application_number || null,
        scheme_name || "PM Surya Ghar Muft Bijli Yojana",
        status,
        submission_date || null,
        approval_date || null,
        subsidyAmt,
        portal_notes || null,
      ]
    );
    appId = res.insertId;
  }

  // Update lead status if subsidy status changed
  if (status === "subsidy_approved" || status === "disbursed") {
    try {
      await db.query(
        `UPDATE leads SET status = 'Subsidy Approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [lead_id]
      );
    } catch (e) {}
  }

  // Log activity
  try {
    await db.query(
      `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark) VALUES (?, 'Status Changed', ?, ?)`,
      [
        lead_id,
        `Subsidy Portal: ${status}`,
        `Consumer No: ${consumer_number} · App No: ${application_number || "Pending"} · Scheme: ${scheme_name || "PM Surya Ghar"}`,
      ]
    );
  } catch (e) {}

  return getSubsidyByLeadId(lead_id, db);
};

// 2. Get Subsidy Tracker & Documents for Lead
const getSubsidyByLeadId = async (leadId, db = defaultDb) => {
  await ensureSubsidyTables(db);
  const [appRows] = await db.query(
    `
    SELECT s.*, l.customer_name, l.lead_code, l.mobile_number
    FROM subsidy_applications s
    LEFT JOIN leads l ON s.lead_id = l.id
    WHERE s.lead_id = ?
    LIMIT 1
    `,
    [leadId]
  );

  const [docsRows] = await db.query(
    `SELECT * FROM customer_documents WHERE lead_id = ? ORDER BY id DESC`,
    [leadId]
  );

  return {
    application: appRows.length > 0 ? appRows[0] : null,
    documents: docsRows,
  };
};

// 3. Save Uploaded Customer Document
const saveCustomerDoc = async (docData, db = defaultDb) => {
  await ensureSubsidyTables(db);
  const { lead_id, document_type, file_name, file_url } = docData;

  const [res] = await db.query(
    `
    INSERT INTO customer_documents (lead_id, document_type, file_name, file_url, verification_status)
    VALUES (?, ?, ?, ?, 'pending')
    `,
    [lead_id, document_type, file_name || "Document", file_url]
  );

  // Return fresh docs list
  const [docs] = await db.query(
    `SELECT * FROM customer_documents WHERE lead_id = ? ORDER BY id DESC`,
    [lead_id]
  );
  return docs;
};

// 4. Update Document Verification Status
const updateDocVerification = async (docId, status, rejectionReason, db = defaultDb) => {
  await ensureSubsidyTables(db);
  await db.query(
    `
    UPDATE customer_documents SET
      verification_status = ?,
      rejection_reason = ?
    WHERE id = ?
    `,
    [status, rejectionReason || null, docId]
  );

  const [rows] = await db.query(`SELECT * FROM customer_documents WHERE id = ? LIMIT 1`, [docId]);
  return rows.length > 0 ? rows[0] : null;
};

module.exports = {
  ensureSubsidyTables,
  applySubsidy,
  getSubsidyByLeadId,
  saveCustomerDoc,
  updateDocVerification,
};
