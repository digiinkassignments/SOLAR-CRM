const { db: defaultDb } = require("../config/db");

// Auto-ensure subsidy_applications, customer_documents, and subsidy_rejection_logs tables
const ensureSubsidyTables = async (db = defaultDb) => {
  const sqlSubsidy = `
    CREATE TABLE IF NOT EXISTS subsidy_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_order_id INT DEFAULT NULL,
      lead_id INT NOT NULL,
      consumer_number VARCHAR(50) NOT NULL,
      application_number VARCHAR(50) DEFAULT NULL,
      scheme_name VARCHAR(100) DEFAULT 'PM Surya Ghar Muft Bijli Yojana',
      portal_status VARCHAR(50) DEFAULT 'registered',
      submission_date DATE DEFAULT NULL,
      approval_date DATE DEFAULT NULL,
      subsidy_amount DECIMAL(10, 2) DEFAULT 0,
      portal_notes TEXT DEFAULT NULL,
      discom_name VARCHAR(100) DEFAULT 'JVVNL',
      discom_division VARCHAR(100) DEFAULT NULL,
      bank_name VARCHAR(100) DEFAULT NULL,
      bank_account_no VARCHAR(50) DEFAULT NULL,
      bank_ifsc VARCHAR(30) DEFAULT NULL,
      bank_account_holder VARCHAR(150) DEFAULT NULL,
      panel_make_model VARCHAR(150) DEFAULT NULL,
      panel_serial_numbers TEXT DEFAULT NULL,
      is_dcr_compliant TINYINT(1) DEFAULT 1,
      inverter_make_model VARCHAR(150) DEFAULT NULL,
      inverter_serial_number VARCHAR(100) DEFAULT NULL,
      expected_subsidy DECIMAL(10,2) DEFAULT 78000.00,
      amount_received DECIMAL(10,2) DEFAULT 0.00,
      credit_date DATE DEFAULT NULL,
      utr_number VARCHAR(100) DEFAULT NULL,
      customer_total_cost DECIMAL(10,2) DEFAULT 0.00,
      customer_amount_paid DECIMAL(10,2) DEFAULT 0.00,
      customer_balance DECIMAL(10,2) DEFAULT 0.00,
      sla_expected_days INT DEFAULT 15,
      stage_started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      rejection_category VARCHAR(100) DEFAULT NULL,
      rejection_fix_task TEXT DEFAULT NULL,
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

  const sqlRejections = `
    CREATE TABLE IF NOT EXISTS subsidy_rejection_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subsidy_id INT DEFAULT NULL,
      lead_id INT NOT NULL,
      stage_at_rejection VARCHAR(60) NOT NULL,
      rejection_category VARCHAR(100) NOT NULL,
      rejection_reason TEXT NOT NULL,
      fix_task TEXT NOT NULL,
      fix_status VARCHAR(50) DEFAULT 'pending',
      resolved_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (lead_id)
    );
  `;

  try {
    await db.query(sqlSubsidy);
    await db.query(sqlDocs);
    await db.query(sqlRejections);

    // Ensure columns exist if table was created previously without them
    const cols = [
      { name: "discom_name", type: "VARCHAR(100) DEFAULT 'JVVNL'" },
      { name: "discom_division", type: "VARCHAR(100) DEFAULT NULL" },
      { name: "bank_name", type: "VARCHAR(100) DEFAULT NULL" },
      { name: "bank_account_no", type: "VARCHAR(50) DEFAULT NULL" },
      { name: "bank_ifsc", type: "VARCHAR(30) DEFAULT NULL" },
      { name: "bank_account_holder", type: "VARCHAR(150) DEFAULT NULL" },
      { name: "panel_make_model", type: "VARCHAR(150) DEFAULT NULL" },
      { name: "panel_serial_numbers", type: "TEXT DEFAULT NULL" },
      { name: "is_dcr_compliant", type: "TINYINT(1) DEFAULT 1" },
      { name: "inverter_make_model", type: "VARCHAR(150) DEFAULT NULL" },
      { name: "inverter_serial_number", type: "VARCHAR(100) DEFAULT NULL" },
      { name: "expected_subsidy", type: "DECIMAL(10,2) DEFAULT 78000.00" },
      { name: "amount_received", type: "DECIMAL(10,2) DEFAULT 0.00" },
      { name: "credit_date", type: "DATE DEFAULT NULL" },
      { name: "utr_number", type: "VARCHAR(100) DEFAULT NULL" },
      { name: "customer_total_cost", type: "DECIMAL(10,2) DEFAULT 0.00" },
      { name: "customer_amount_paid", type: "DECIMAL(10,2) DEFAULT 0.00" },
      { name: "customer_balance", type: "DECIMAL(10,2) DEFAULT 0.00" },
      { name: "sla_expected_days", type: "INT DEFAULT 15" },
      { name: "stage_started_at", type: "DATETIME DEFAULT CURRENT_TIMESTAMP" },
      { name: "rejection_category", type: "VARCHAR(100) DEFAULT NULL" },
      { name: "rejection_fix_task", type: "TEXT DEFAULT NULL" },
    ];

    for (const col of cols) {
      try {
        await db.query(`ALTER TABLE subsidy_applications ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {
        // Ignored if column already exists
      }
    }
  } catch (err) {
    console.error("ensureSubsidyTables error:", err);
  }
};

ensureSubsidyTables().catch(() => {});

// SLA Days mapping for the 9 stages
const STAGE_SLA_DAYS = {
  registered: 2,
  feasibility_approved: 7,
  vendor_selected: 3,
  agreement_uploaded: 2,
  installed_docs_uploaded: 10,
  net_meter_applied: 15,
  commissioning_issued: 7,
  bank_details_submitted: 2,
  subsidy_credited: 30,
  rejected: 5,
};

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
    discom_name,
    discom_division,
    bank_name,
    bank_account_no,
    bank_ifsc,
    bank_account_holder,
    panel_make_model,
    panel_serial_numbers,
    is_dcr_compliant,
    inverter_make_model,
    inverter_serial_number,
    expected_subsidy,
    amount_received,
    credit_date,
    utr_number,
    customer_total_cost,
    customer_amount_paid,
    customer_balance,
    sla_expected_days,
  } = data;

  const parseNum = (val, fallback = 0) => {
    if (val === "" || val === null || val === undefined) return fallback;
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  };

  const subsidyAmt = parseNum(subsidy_amount);
  const expSubsidy = parseNum(expected_subsidy, 78000);
  const recSubsidy = parseNum(amount_received, 0);
  const custTotal = parseNum(customer_total_cost, 0);
  const custPaid = parseNum(customer_amount_paid, 0);
  const custBal = customer_balance !== undefined ? parseNum(customer_balance, 0) : Math.max(0, custTotal - custPaid);
  const orderId = project_order_id && !isNaN(Number(project_order_id)) ? Number(project_order_id) : null;
  const status = portal_status || "registered";
  const slaDays = parseNum(sla_expected_days, STAGE_SLA_DAYS[status] || 15);
  const dcrFlag = is_dcr_compliant === false || is_dcr_compliant === 0 || is_dcr_compliant === "0" ? 0 : 1;

  const [existing] = await db.query(
    `SELECT id, portal_status FROM subsidy_applications WHERE lead_id = ? LIMIT 1`,
    [lead_id]
  );

  let appId;
  if (existing.length > 0) {
    appId = existing[0].id;
    const statusChanged = existing[0].portal_status !== status;

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
        discom_name = ?,
        discom_division = ?,
        bank_name = ?,
        bank_account_no = ?,
        bank_ifsc = ?,
        bank_account_holder = ?,
        panel_make_model = ?,
        panel_serial_numbers = ?,
        is_dcr_compliant = ?,
        inverter_make_model = ?,
        inverter_serial_number = ?,
        expected_subsidy = ?,
        amount_received = ?,
        credit_date = ?,
        utr_number = ?,
        customer_total_cost = ?,
        customer_amount_paid = ?,
        customer_balance = ?,
        sla_expected_days = ?,
        stage_started_at = IF(? = 1, CURRENT_TIMESTAMP, stage_started_at),
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
        discom_name || "JVVNL",
        discom_division || null,
        bank_name || null,
        bank_account_no || null,
        bank_ifsc || null,
        bank_account_holder || null,
        panel_make_model || null,
        panel_serial_numbers || null,
        dcrFlag,
        inverter_make_model || null,
        inverter_serial_number || null,
        expSubsidy,
        recSubsidy,
        credit_date || null,
        utr_number || null,
        custTotal,
        custPaid,
        custBal,
        slaDays,
        statusChanged ? 1 : 0,
        appId,
      ]
    );
  } else {
    const [res] = await db.query(
      `
      INSERT INTO subsidy_applications (
        lead_id, project_order_id, consumer_number, application_number,
        scheme_name, portal_status, submission_date, approval_date,
        subsidy_amount, portal_notes, discom_name, discom_division,
        bank_name, bank_account_no, bank_ifsc, bank_account_holder,
        panel_make_model, panel_serial_numbers, is_dcr_compliant,
        inverter_make_model, inverter_serial_number, expected_subsidy,
        amount_received, credit_date, utr_number, customer_total_cost,
        customer_amount_paid, customer_balance, sla_expected_days, stage_started_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
        discom_name || "JVVNL",
        discom_division || null,
        bank_name || null,
        bank_account_no || null,
        bank_ifsc || null,
        bank_account_holder || null,
        panel_make_model || null,
        panel_serial_numbers || null,
        dcrFlag,
        inverter_make_model || null,
        inverter_serial_number || null,
        expSubsidy,
        recSubsidy,
        credit_date || null,
        utr_number || null,
        custTotal,
        custPaid,
        custBal,
        slaDays,
      ]
    );
    appId = res.insertId;
  }

  // Update lead status if subsidy is credited
  if (status === "subsidy_credited" || status === "disbursed" || status === "subsidy_approved") {
    try {
      await db.query(
        `UPDATE leads SET status = 'Subsidy Credited', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [lead_id]
      );
    } catch (e) {}
  }

  // Sync to linked project audit log
  try {
    const [projs] = await db.query(
      `SELECT id, stage FROM projects WHERE lead_id = ? AND is_deleted = 0 LIMIT 1`,
      [lead_id]
    );
    if (projs.length > 0) {
      const projId = projs[0].id;
      let stageNote = `Subsidy Portal Step: ${status}. Consumer: ${consumer_number}, DISCOM: ${discom_name || "JVVNL"}, DCR: ${dcrFlag ? "Yes" : "No"}.`;
      if (portal_notes) {
        stageNote += ` Notes: ${portal_notes}`;
      }
      await db.query(
        `INSERT INTO project_stage_logs (project_id, previous_stage, new_stage, changed_by, notes)
         VALUES (?, ?, ?, 1, ?)`,
        [projId, projs[0].stage, projs[0].stage, stageNote]
      ).catch(() => {});
    }
  } catch (projErr) {
    console.error("Project sync error in applySubsidy:", projErr);
  }

  // Log activity
  try {
    await db.query(
      `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark) VALUES (?, 'Subsidy Portal Updated', ?, ?)`,
      [
        lead_id,
        `Stage: ${status}`,
        `Consumer: ${consumer_number} · DISCOM: ${discom_name || "JVVNL"} · Expected Subsidy: ₹${expSubsidy}`,
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
    SELECT s.*,
           l.customer_name, l.lead_code, l.mobile_number, l.email, l.address, l.city, l.state, l.pincode,
           p.id AS project_id, p.project_number, p.stage AS project_stage, COALESCE(p.system_capacity_kw, l.required_kw, 3.5) AS system_capacity_kw,
           l.quotation_amount AS deal_amount
    FROM subsidy_applications s
    LEFT JOIN leads l ON s.lead_id = l.id
    LEFT JOIN projects p ON p.lead_id = l.id AND p.is_deleted = 0
    WHERE s.lead_id = ?
    LIMIT 1
    `,
    [leadId]
  );

  let application = null;
  if (appRows.length > 0) {
    application = appRows[0];
  } else {
    // If no subsidy application record exists yet, fetch default info from leads & projects
    const [leadInfo] = await db.query(
      `
      SELECT l.id AS lead_id, l.customer_name, l.lead_code, l.mobile_number, l.email, l.address, l.city, l.state, l.pincode,
             p.id AS project_id, p.project_number, p.stage AS project_stage, COALESCE(p.system_capacity_kw, l.required_kw, 3.5) AS system_capacity_kw,
             l.quotation_amount AS deal_amount
      FROM leads l
      LEFT JOIN projects p ON p.lead_id = l.id AND p.is_deleted = 0
      WHERE l.id = ?
      LIMIT 1
      `,
      [leadId]
    );
    if (leadInfo.length > 0) {
      application = {
        lead_id: leadInfo[0].lead_id,
        customer_name: leadInfo[0].customer_name,
        lead_code: leadInfo[0].lead_code,
        mobile_number: leadInfo[0].mobile_number,
        email: leadInfo[0].email,
        address: leadInfo[0].address,
        city: leadInfo[0].city,
        state: leadInfo[0].state,
        pincode: leadInfo[0].pincode,
        project_id: leadInfo[0].project_id,
        project_number: leadInfo[0].project_number,
        project_stage: leadInfo[0].project_stage,
        system_capacity_kw: leadInfo[0].system_capacity_kw || 3.5,
        consumer_number: "",
        application_number: "",
        scheme_name: "PM Surya Ghar Muft Bijli Yojana",
        portal_status: "registered",
        discom_name: "JVVNL",
        discom_division: "",
        bank_name: "",
        bank_account_no: "",
        bank_ifsc: "",
        bank_account_holder: leadInfo[0].customer_name || "",
        panel_make_model: "Waaree 540W Mono PERC",
        panel_serial_numbers: "",
        is_dcr_compliant: 1,
        inverter_make_model: "Growatt 5kW On-Grid",
        inverter_serial_number: "",
        expected_subsidy: 78000.00,
        amount_received: 0.00,
        customer_total_cost: leadInfo[0].deal_amount || 220000.00,
        customer_amount_paid: 0.00,
        customer_balance: leadInfo[0].deal_amount || 220000.00,
        sla_expected_days: 2,
        stage_started_at: new Date(),
        portal_notes: "",
      };
    }
  }

  const [docsRows] = await db.query(
    `SELECT * FROM customer_documents WHERE lead_id = ? ORDER BY id DESC`,
    [leadId]
  );

  let rejectionLogs = [];
  try {
    const [rejRows] = await db.query(
      `SELECT * FROM subsidy_rejection_logs WHERE lead_id = ? ORDER BY id DESC`,
      [leadId]
    );
    rejectionLogs = rejRows;
  } catch (e) {}

  let logs = [];
  try {
    const [logRows] = await db.query(
      `SELECT * FROM lead_activity_logs WHERE lead_id = ? AND (action_type LIKE '%Subsidy%' OR remark LIKE '%Consumer%' OR remark LIKE '%Portal%') ORDER BY id DESC LIMIT 15`,
      [leadId]
    );
    logs = logRows;
  } catch (e) {}

  return {
    application,
    documents: docsRows,
    rejections: rejectionLogs,
    logs,
  };
};

// 3. Save Uploaded Customer Document
const saveCustomerDoc = async (docData, db = defaultDb) => {
  await ensureSubsidyTables(db);
  const { lead_id, document_type, file_name, file_url } = docData;

  await db.query(
    `
    INSERT INTO customer_documents (lead_id, document_type, file_name, file_url, verification_status)
    VALUES (?, ?, ?, ?, 'pending')
    `,
    [lead_id, document_type, file_name || "Document", file_url]
  );

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

// 5. Log Subsidy Rejection & Create Fix Task
const logSubsidyRejection = async (rejectionData, db = defaultDb) => {
  await ensureSubsidyTables(db);
  const { lead_id, subsidy_id, stage_at_rejection, rejection_category, rejection_reason, fix_task } = rejectionData;

  const [res] = await db.query(
    `
    INSERT INTO subsidy_rejection_logs (
      subsidy_id, lead_id, stage_at_rejection, rejection_category, rejection_reason, fix_task, fix_status
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `,
    [subsidy_id || null, lead_id, stage_at_rejection, rejection_category, rejection_reason, fix_task]
  );

  // Update application status to rejected
  await db.query(
    `
    UPDATE subsidy_applications SET
      portal_status = 'rejected',
      rejection_category = ?,
      rejection_fix_task = ?,
      portal_notes = CONCAT(IFNULL(portal_notes, ''), '\n[REJECTED: ', ?, '] Fix Task: ', ?),
      stage_started_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE lead_id = ?
    `,
    [rejection_category, fix_task, rejection_category, fix_task, lead_id]
  );

  // Log in activity logs
  try {
    await db.query(
      `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark) VALUES (?, 'Subsidy Rejection Logged', ?, ?)`,
      [
        lead_id,
        `Category: ${rejection_category}`,
        `Reason: ${rejection_reason} | Action Task: ${fix_task}`,
      ]
    );
  } catch (e) {}

  return {
    rejectionId: res.insertId,
    ...(await getSubsidyByLeadId(lead_id, db)),
  };
};

// 6. Resolve Rejection Fix Task
const resolveRejectionFixTask = async (logId, db = defaultDb) => {
  await ensureSubsidyTables(db);
  await db.query(
    `UPDATE subsidy_rejection_logs SET fix_status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [logId]
  );
  const [rows] = await db.query(`SELECT lead_id FROM subsidy_rejection_logs WHERE id = ? LIMIT 1`, [logId]);
  if (rows.length > 0) {
    return getSubsidyByLeadId(rows[0].lead_id, db);
  }
  return { success: true };
};

// 7. Get All Subsidies with Portal Data, Owners & SLA calculations
const getAllSubsidies = async (params = {}, db = defaultDb) => {
  await ensureSubsidyTables(db);
  const { page = 1, limit = 20, search = "", status = "All" } = params;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  let whereClauses = ["1=1"];
  let queryParams = [];

  if (search && search.trim() !== "") {
    const s = `%${search.trim()}%`;
    whereClauses.push("(l.customer_name LIKE ? OR l.mobile_number LIKE ? OR s.consumer_number LIKE ? OR s.application_number LIKE ? OR l.lead_code LIKE ?)");
    queryParams.push(s, s, s, s, s);
  }

  if (status && status !== "All") {
    whereClauses.push("s.portal_status = ?");
    queryParams.push(status);
  }

  const whereSql = whereClauses.join(" AND ");

  // Count
  const [countRows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM leads l
    LEFT JOIN subsidy_applications s ON s.lead_id = l.id
    WHERE ${whereSql}
    `,
    queryParams
  );
  const total = countRows[0]?.total || 0;

  // Data
  const [rows] = await db.query(
    `
    SELECT
      l.id AS lead_id,
      l.customer_name,
      l.mobile_number,
      l.email,
      l.city,
      l.state,
      l.address,
      l.pincode,
      l.lead_code,
      l.status AS lead_status,
      p.id AS project_id,
      p.project_number,
      p.stage AS project_stage,
      COALESCE(p.system_capacity_kw, l.required_kw, 3.5) AS system_capacity_kw,
      l.quotation_amount AS deal_amount,
      s.id AS subsidy_id,
      s.consumer_number,
      s.application_number,
      s.scheme_name,
      COALESCE(s.portal_status, 'registered') AS portal_status,
      s.discom_name,
      s.discom_division,
      s.is_dcr_compliant,
      s.expected_subsidy,
      s.amount_received,
      s.credit_date,
      s.utr_number,
      s.customer_total_cost,
      s.customer_amount_paid,
      s.customer_balance,
      s.sla_expected_days,
      s.stage_started_at,
      s.rejection_category,
      s.rejection_fix_task,
      s.submission_date,
      s.approval_date,
      s.portal_notes,
      TIMESTAMPDIFF(DAY, COALESCE(s.stage_started_at, s.created_at, l.created_at), NOW()) AS days_in_stage,
      (SELECT COUNT(*) FROM customer_documents cd WHERE cd.lead_id = l.id) AS total_docs_uploaded,
      (SELECT COUNT(*) FROM subsidy_rejection_logs srl WHERE srl.lead_id = l.id AND srl.fix_status = 'pending') AS active_rejections_count
    FROM leads l
    LEFT JOIN subsidy_applications s ON s.lead_id = l.id
    LEFT JOIN projects p ON p.lead_id = l.id AND p.is_deleted = 0
    WHERE ${whereSql}
    ORDER BY l.id DESC
    LIMIT ? OFFSET ?
    `,
    [...queryParams, parseInt(limit), parseInt(offset)]
  );

  // Overall Stats across all records
  const [statsRows] = await db.query(`
    SELECT
      COUNT(*) AS total_projects,
      SUM(CASE WHEN s.portal_status = 'registered' OR s.portal_status IS NULL THEN 1 ELSE 0 END) AS count_registered,
      SUM(CASE WHEN s.portal_status = 'feasibility_approved' THEN 1 ELSE 0 END) AS count_feasibility,
      SUM(CASE WHEN s.portal_status = 'agreement_uploaded' OR s.portal_status = 'installed_docs_uploaded' THEN 1 ELSE 0 END) AS count_in_installation,
      SUM(CASE WHEN s.portal_status = 'net_meter_applied' OR s.portal_status = 'commissioning_issued' THEN 1 ELSE 0 END) AS count_net_meter,
      SUM(CASE WHEN s.portal_status = 'subsidy_credited' OR s.portal_status = 'disbursed' THEN 1 ELSE 0 END) AS count_credited,
      SUM(CASE WHEN s.portal_status = 'rejected' THEN 1 ELSE 0 END) AS count_rejected,
      SUM(COALESCE(s.expected_subsidy, 78000)) AS total_expected_subsidy,
      SUM(COALESCE(s.amount_received, 0)) AS total_disbursed_subsidy
    FROM leads l
    LEFT JOIN subsidy_applications s ON s.lead_id = l.id
  `);

  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    subsidies: rows,
    stats: statsRows[0] || {},
  };
};

module.exports = {
  ensureSubsidyTables,
  STAGE_SLA_DAYS,
  applySubsidy,
  getSubsidyByLeadId,
  saveCustomerDoc,
  updateDocVerification,
  logSubsidyRejection,
  resolveRejectionFixTask,
  getAllSubsidies,
};
