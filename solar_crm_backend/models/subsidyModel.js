const managerScope=require("../utils/managerScope");
const { db: defaultDb } = require("../config/db");

// Auto-ensure subsidy_applications, customer_documents, and subsidy_rejection_logs tables
const ensured = new WeakSet();
const ensureSubsidyTables = async (db = defaultDb) => {
  if (ensured.has(db)) return;
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
      { name: "sanctioned_capacity_kw", type: "DECIMAL(10,3) DEFAULT NULL" },
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
        if (e.code !== 'ER_DUP_FIELDNAME') throw e;
      }
    }
    ensured.add(db);
  } catch (err) {
    console.error("ensureSubsidyTables error:", err);
    throw err;
  }
};

// Schema setup is explicit; importing the model must not mutate the default tenant.

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
const applySubsidy = async (data, db = defaultDb, actor, access) => {
  if (!actor || !access?.can_edit)
    throw Object.assign(new Error('Only Application Manager and Super Admin can edit the Subsidy Tracker.'), {status:403});
  return require('../services/subsidySync').save(db,data,actor,access);
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
    LEFT JOIN projects p ON p.id = s.project_id AND p.is_deleted = 0
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

  const [syncLogs] = await db.query(`SELECT CONCAT('sync-',id) AS id,
    CASE WHEN status='tracker_saved' THEN 'Subsidy Tracker updated'
      WHEN status='synced' THEN 'Automatic project sync' ELSE 'Subsidy sync requires review' END AS action_type,
    to_stage AS new_value,CONCAT('Recorded by user #',COALESCE(actor_id,0)) AS remark,created_at
    FROM subsidy_sync_logs sl WHERE tracker_id=? ORDER BY sl.id DESC LIMIT 30`,[application?.id || 0]);
  logs=[...syncLogs,...logs].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,30);
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
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
  const readerId = Number(params.readerId);
  const where = ["((p.id IS NOT NULL AND p.is_deleted=0) OR (s.project_id IS NULL AND l.is_deleted=0))", "COALESCE(p.subsidy_applicable,1)=1"];
  const args = [];
  if (Number(params.readerRole) === 3) { where.push('l.assigned_to=?'); args.push(readerId); }
  if (Number(params.readerRole) === 2) {
    where.push('l.assigned_to IN (SELECT id FROM users WHERE manager_id=? AND role_id=3 AND is_deleted=0)');
    args.push(readerId);
  }
  if (Number(params.readerRole) === 4 && Number.isSafeInteger(readerId) && readerId > 0) {
    where.push(`(p.assigned_to=? OR l.id IN (${require('../services/field/workflow').assignedLeadSQL(readerId)}))`);
    args.push(readerId);
  }
  if (params.search?.trim()) {
    where.push('(COALESCE(p.customer_name,l.customer_name) LIKE ? OR l.mobile_number LIKE ? OR s.consumer_number LIKE ? OR s.application_number LIKE ?)');
    args.push(...Array(4).fill(`%${params.search.trim()}%`));
  }
  if (params.status && params.status !== 'All') { where.push('s.portal_status=?'); args.push(params.status); }
  const from = `FROM subsidy_applications s LEFT JOIN leads l ON l.id=s.lead_id
    LEFT JOIN projects p ON p.id=s.project_id WHERE ${where.join(' AND ')}`;
  const [[count]] = await db.query(`SELECT COUNT(*) AS total ${from}`, args);
  const [rows] = await db.query(`SELECT s.*,s.id AS subsidy_id,
    COALESCE(CAST(s.lead_id AS CHAR),CONCAT('project-',p.id)) AS lead_id,
    COALESCE(p.customer_name,l.customer_name) AS customer_name,
    COALESCE(p.customer_phone,l.mobile_number) AS mobile_number,l.email,l.lead_code,
    COALESCE(p.city,l.city) AS city,COALESCE(p.state,l.state) AS state,
    p.project_number,p.stage AS project_stage,p.system_capacity_kw,
    TIMESTAMPDIFF(DAY,COALESCE(s.stage_started_at,s.created_at),NOW()) AS days_in_stage,
    (SELECT COUNT(*) FROM customer_documents d WHERE d.lead_id=s.lead_id OR d.project_id=s.project_id) AS total_docs_uploaded,
    (SELECT COUNT(*) FROM subsidy_rejection_logs r WHERE r.subsidy_id=s.id AND r.fix_status='pending') AS active_rejections_count
    ${from} ORDER BY s.id DESC LIMIT ? OFFSET ?`, [...args,limit,(page-1)*limit]);
  const localDate = require('../services/subsidyRules').today(await require('../services/subsidySync').companyTimeZone(db));
  const credited = `s.portal_status='subsidy_credited' AND s.amount_received>0 AND NULLIF(TRIM(s.utr_number),'') IS NOT NULL
    AND s.credit_date IS NOT NULL AND s.credit_date<='${localDate}'
    AND EXISTS(SELECT 1 FROM project_commissioning pc WHERE pc.project_id=s.project_id AND pc.is_deleted=0 AND pc.commission_date<s.credit_date)`;
  const [[stats]] = await db.query(`SELECT COUNT(*) AS total_projects,
    SUM(s.portal_status='registered') AS count_registered,
    SUM(s.portal_status='feasibility_approved') AS count_feasibility,
    SUM(s.portal_status IN ('agreement_uploaded','installed_docs_uploaded')) AS count_in_installation,
    SUM(s.portal_status IN ('net_meter_applied','commissioning_issued','bank_details_submitted')) AS count_net_meter,
    SUM(${credited}) AS count_credited,
    SUM(s.portal_status='rejected') AS count_rejected,
    COALESCE(SUM(s.expected_subsidy),0) AS total_expected_subsidy,
    COALESCE(SUM(CASE WHEN ${credited} THEN s.amount_received ELSE 0 END),0) AS total_disbursed_subsidy,
    COALESCE(SUM(CASE WHEN NOT (${credited}) THEN s.expected_subsidy ELSE 0 END),0) AS pending_subsidy_amount,
    SUM(NOT (${credited})) AS pending_projects,
    SUM(NOT (${credited}) AND TIMESTAMPDIFF(DAY,s.stage_started_at,NOW())>s.sla_expected_days) AS stuck_applications,
    COALESCE(SUM(CASE WHEN ${credited} AND DATE_FORMAT(s.credit_date,'%Y-%m')=DATE_FORMAT('${localDate}','%Y-%m') THEN s.amount_received ELSE 0 END),0) AS credited_this_month
    ${from}`,args);
  const [stuck_by_stage] = await db.query(`SELECT s.portal_status AS label,COUNT(*) AS count ${from}
    AND NOT (${credited}) AND TIMESTAMPDIFF(DAY,s.stage_started_at,NOW())>COALESCE(s.sla_expected_days,15)
    GROUP BY s.portal_status`,args);
  return {total:Number(count.total),page,limit,subsidies:rows,stats,stuck_by_stage};
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
