const { db: defaultDb } = require("../config/db");

// Auto-ensure solar_loans and loan_documents tables
const ensureLoanTables = async (db = defaultDb) => {
  const sqlLoans = `
    CREATE TABLE IF NOT EXISTS solar_loans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lead_id INT NOT NULL,
      project_id INT DEFAULT NULL,
      customer_name VARCHAR(150) DEFAULT NULL,
      customer_phone VARCHAR(50) DEFAULT NULL,
      customer_email VARCHAR(150) DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      bank_name VARCHAR(100) NOT NULL DEFAULT 'State Bank of India (SBI)',
      bank_branch VARCHAR(150) DEFAULT NULL,
      bank_ifsc VARCHAR(30) DEFAULT NULL,
      bank_dsa_name VARCHAR(150) DEFAULT NULL,
      bank_dsa_phone VARCHAR(50) DEFAULT NULL,
      portal_application_no VARCHAR(100) DEFAULT NULL,
      loan_stage VARCHAR(50) NOT NULL DEFAULT 'Applied / Logged',
      system_capacity_kw DECIMAL(8, 2) DEFAULT 3.00,
      total_project_cost DECIMAL(12, 2) DEFAULT 0.00,
      subsidy_expected DECIMAL(12, 2) DEFAULT 78000.00,
      down_payment_amount DECIMAL(12, 2) DEFAULT 0.00,
      loan_amount_applied DECIMAL(12, 2) DEFAULT 0.00,
      sanctioned_amount DECIMAL(12, 2) DEFAULT 0.00,
      disbursed_amount DECIMAL(12, 2) DEFAULT 0.00,
      interest_rate DECIMAL(5, 2) DEFAULT 7.00,
      tenure_months INT DEFAULT 60,
      monthly_emi DECIMAL(10, 2) DEFAULT 0.00,
      cibil_score INT DEFAULT NULL,
      electricity_consumer_no VARCHAR(100) DEFAULT NULL,
      co_applicant_name VARCHAR(150) DEFAULT NULL,
      co_applicant_relation VARCHAR(50) DEFAULT NULL,
      applied_date DATE DEFAULT NULL,
      sanction_date DATE DEFAULT NULL,
      disbursal_date DATE DEFAULT NULL,
      first_emi_date DATE DEFAULT NULL,
      bank_query_remarks TEXT DEFAULT NULL,
      internal_notes TEXT DEFAULT NULL,
      sanction_letter_url VARCHAR(255) DEFAULT NULL,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );
  `;

  const sqlDocs = `
    CREATE TABLE IF NOT EXISTS loan_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loan_id INT NOT NULL,
      lead_id INT NOT NULL,
      doc_type VARCHAR(100) NOT NULL,
      file_name VARCHAR(255) DEFAULT NULL,
      file_url VARCHAR(255) NOT NULL,
      verification_status VARCHAR(50) DEFAULT 'Pending',
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES solar_loans(id) ON DELETE CASCADE
    );
  `;

  try {
    await db.query(sqlLoans);
    await db.query(sqlDocs);
  } catch (err) {
    console.warn("ensureLoanTables notice:", err.message);
  }
};

// Calculate PMT EMI helper: P * r * (1+r)^n / ((1+r)^n - 1)
const calculateMonthlyEMI = (principal, annualRate, tenureMonths) => {
  const P = parseFloat(principal) || 0;
  const r = (parseFloat(annualRate) || 7) / 12 / 100;
  const n = parseInt(tenureMonths) || 60;
  if (P <= 0 || r <= 0 || n <= 0) return 0;
  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
};

// 1. Create a new loan application
const createLoan = async (data, db = defaultDb) => {
  await ensureLoanTables(db);

  let emi = parseFloat(data.monthly_emi) || 0;
  if (!emi && (data.loan_amount_applied || data.sanctioned_amount)) {
    const loanP = parseFloat(data.sanctioned_amount) || parseFloat(data.loan_amount_applied) || 0;
    emi = calculateMonthlyEMI(loanP, data.interest_rate || 7.0, data.tenure_months || 60);
  }

  const query = `
    INSERT INTO solar_loans (
      lead_id, project_id, customer_name, customer_phone, customer_email, city, state,
      bank_name, bank_branch, bank_ifsc, bank_dsa_name, bank_dsa_phone, portal_application_no,
      loan_stage, system_capacity_kw, total_project_cost, subsidy_expected, down_payment_amount,
      loan_amount_applied, sanctioned_amount, disbursed_amount, interest_rate, tenure_months, monthly_emi,
      cibil_score, electricity_consumer_no, co_applicant_name, co_applicant_relation,
      applied_date, sanction_date, disbursal_date, first_emi_date, bank_query_remarks, internal_notes,
      sanction_letter_url, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.lead_id,
    data.project_id || null,
    data.customer_name || null,
    data.customer_phone || null,
    data.customer_email || null,
    data.city || null,
    data.state || null,
    data.bank_name || "State Bank of India (SBI)",
    data.bank_branch || null,
    data.bank_ifsc || null,
    data.bank_dsa_name || null,
    data.bank_dsa_phone || null,
    data.portal_application_no || null,
    data.loan_stage || "Applied / Logged",
    parseFloat(data.system_capacity_kw) || 3.0,
    parseFloat(data.total_project_cost) || 0,
    parseFloat(data.subsidy_expected) || 78000,
    parseFloat(data.down_payment_amount) || 0,
    parseFloat(data.loan_amount_applied) || 0,
    parseFloat(data.sanctioned_amount) || 0,
    parseFloat(data.disbursed_amount) || 0,
    parseFloat(data.interest_rate) || 7.0,
    parseInt(data.tenure_months) || 60,
    emi,
    data.cibil_score ? parseInt(data.cibil_score) : null,
    data.electricity_consumer_no || null,
    data.co_applicant_name || null,
    data.co_applicant_relation || null,
    data.applied_date || new Date().toISOString().slice(0, 10),
    data.sanction_date || null,
    data.disbursal_date || null,
    data.first_emi_date || null,
    data.bank_query_remarks || null,
    data.internal_notes || null,
    data.sanction_letter_url || null,
    data.created_by || null,
  ];

  const [res] = await db.query(query, values);
  return getLoanById(res.insertId, db);
};

// 2. Get Loan By ID with documents
const getLoanById = async (id, db = defaultDb) => {
  await ensureLoanTables(db);
  const [rows] = await db.query(
    `SELECT l.*, 
            ld.name AS lead_customer_name, ld.phone AS lead_phone, ld.email AS lead_email,
            ld.city AS lead_city, ld.state AS lead_state, ld.required_kw AS lead_kw,
            p.project_number
     FROM solar_loans l
     LEFT JOIN leads ld ON l.lead_id = ld.id
     LEFT JOIN projects p ON l.project_id = p.id
     WHERE l.id = ?`,
    [id]
  );

  if (rows.length === 0) return null;
  const loan = rows[0];

  const [docs] = await db.query(
    `SELECT * FROM loan_documents WHERE loan_id = ? ORDER BY uploaded_at DESC`,
    [id]
  );
  loan.documents = docs || [];

  return loan;
};

// 3. Get Loan by Lead ID
const getLoanByLeadId = async (leadId, db = defaultDb) => {
  await ensureLoanTables(db);
  const [rows] = await db.query(
    `SELECT * FROM solar_loans WHERE lead_id = ? ORDER BY id DESC LIMIT 1`,
    [leadId]
  );
  if (rows.length === 0) return null;
  return getLoanById(rows[0].id, db);
};

// 4. Get Loan by Project ID
const getLoanByProjectId = async (projectId, db = defaultDb) => {
  await ensureLoanTables(db);
  const [rows] = await db.query(
    `SELECT * FROM solar_loans WHERE project_id = ? ORDER BY id DESC LIMIT 1`,
    [projectId]
  );
  if (rows.length === 0) return null;
  return getLoanById(rows[0].id, db);
};

// 5. Get All Loans with filters, pagination, and KPI counts
const getAllLoans = async ({ search = "", stage = "", bank = "", page = 1, limit = 20 }, db = defaultDb) => {
  await ensureLoanTables(db);

  let whereClauses = ["1=1"];
  let params = [];

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    whereClauses.push(
      `(l.customer_name LIKE ? OR l.customer_phone LIKE ? OR l.portal_application_no LIKE ? OR l.bank_name LIKE ? OR p.project_number LIKE ?)`
    );
    params.push(s, s, s, s, s);
  }

  if (stage && stage !== "All") {
    whereClauses.push(`l.loan_stage = ?`);
    params.push(stage);
  }

  if (bank && bank !== "All") {
    whereClauses.push(`l.bank_name LIKE ?`);
    params.push(`%${bank}%`);
  }

  const whereSQL = whereClauses.join(" AND ");

  // Count total matching
  const [countRows] = await db.query(
    `SELECT COUNT(*) as total 
     FROM solar_loans l 
     LEFT JOIN projects p ON l.project_id = p.id 
     WHERE ${whereSQL}`,
    params
  );
  const total = countRows[0]?.total || 0;

  // Pagination
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const query = `
    SELECT l.*, 
           ld.name AS lead_name, ld.phone AS lead_phone,
           p.project_number, p.stage as project_stage
    FROM solar_loans l
    LEFT JOIN leads ld ON l.lead_id = ld.id
    LEFT JOIN projects p ON l.project_id = p.id
    WHERE ${whereSQL}
    ORDER BY l.id DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);

  return {
    loans: rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)) || 1,
  };
};

// 6. Get Global KPI Stats
const getLoanStats = async (db = defaultDb) => {
  await ensureLoanTables(db);
  const [rows] = await db.query(`
    SELECT 
      COUNT(*) AS total_loans,
      SUM(CASE WHEN loan_stage IN ('Eligibility Check', 'Docs Pending', 'Applied / Logged', 'Bank FI & Verification') THEN 1 ELSE 0 END) AS in_process_loans,
      SUM(CASE WHEN loan_stage = 'Sanctioned' THEN 1 ELSE 0 END) AS sanctioned_loans,
      SUM(CASE WHEN loan_stage IN ('Disbursed', 'Subsidy Adjusted') THEN 1 ELSE 0 END) AS disbursed_loans,
      SUM(CASE WHEN loan_stage = 'Rejected' THEN 1 ELSE 0 END) AS rejected_loans,
      COALESCE(SUM(loan_amount_applied), 0) AS total_applied_amount,
      COALESCE(SUM(sanctioned_amount), 0) AS total_sanctioned_amount,
      COALESCE(SUM(disbursed_amount), 0) AS total_disbursed_amount
    FROM solar_loans
  `);
  return rows[0] || {};
};

// 7. Update Loan
const updateLoan = async (id, data, db = defaultDb) => {
  await ensureLoanTables(db);

  let emi = parseFloat(data.monthly_emi);
  if (!emi && (data.sanctioned_amount || data.loan_amount_applied)) {
    const loanP = parseFloat(data.sanctioned_amount) || parseFloat(data.loan_amount_applied) || 0;
    emi = calculateMonthlyEMI(loanP, data.interest_rate || 7.0, data.tenure_months || 60);
  }

  const query = `
    UPDATE solar_loans SET
      customer_name = COALESCE(?, customer_name),
      customer_phone = COALESCE(?, customer_phone),
      customer_email = COALESCE(?, customer_email),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      bank_name = COALESCE(?, bank_name),
      bank_branch = COALESCE(?, bank_branch),
      bank_ifsc = COALESCE(?, bank_ifsc),
      bank_dsa_name = COALESCE(?, bank_dsa_name),
      bank_dsa_phone = COALESCE(?, bank_dsa_phone),
      portal_application_no = COALESCE(?, portal_application_no),
      loan_stage = COALESCE(?, loan_stage),
      system_capacity_kw = COALESCE(?, system_capacity_kw),
      total_project_cost = COALESCE(?, total_project_cost),
      subsidy_expected = COALESCE(?, subsidy_expected),
      down_payment_amount = COALESCE(?, down_payment_amount),
      loan_amount_applied = COALESCE(?, loan_amount_applied),
      sanctioned_amount = COALESCE(?, sanctioned_amount),
      disbursed_amount = COALESCE(?, disbursed_amount),
      interest_rate = COALESCE(?, interest_rate),
      tenure_months = COALESCE(?, tenure_months),
      monthly_emi = COALESCE(?, monthly_emi),
      cibil_score = COALESCE(?, cibil_score),
      electricity_consumer_no = COALESCE(?, electricity_consumer_no),
      co_applicant_name = COALESCE(?, co_applicant_name),
      co_applicant_relation = COALESCE(?, co_applicant_relation),
      applied_date = COALESCE(?, applied_date),
      sanction_date = COALESCE(?, sanction_date),
      disbursal_date = COALESCE(?, disbursal_date),
      first_emi_date = COALESCE(?, first_emi_date),
      bank_query_remarks = COALESCE(?, bank_query_remarks),
      internal_notes = COALESCE(?, internal_notes),
      sanction_letter_url = COALESCE(?, sanction_letter_url)
    WHERE id = ?
  `;

  const values = [
    data.customer_name ?? null,
    data.customer_phone ?? null,
    data.customer_email ?? null,
    data.city ?? null,
    data.state ?? null,
    data.bank_name ?? null,
    data.bank_branch ?? null,
    data.bank_ifsc ?? null,
    data.bank_dsa_name ?? null,
    data.bank_dsa_phone ?? null,
    data.portal_application_no ?? null,
    data.loan_stage ?? null,
    data.system_capacity_kw != null ? parseFloat(data.system_capacity_kw) : null,
    data.total_project_cost != null ? parseFloat(data.total_project_cost) : null,
    data.subsidy_expected != null ? parseFloat(data.subsidy_expected) : null,
    data.down_payment_amount != null ? parseFloat(data.down_payment_amount) : null,
    data.loan_amount_applied != null ? parseFloat(data.loan_amount_applied) : null,
    data.sanctioned_amount != null ? parseFloat(data.sanctioned_amount) : null,
    data.disbursed_amount != null ? parseFloat(data.disbursed_amount) : null,
    data.interest_rate != null ? parseFloat(data.interest_rate) : null,
    data.tenure_months != null ? parseInt(data.tenure_months) : null,
    emi || (data.monthly_emi != null ? parseFloat(data.monthly_emi) : null),
    data.cibil_score != null ? parseInt(data.cibil_score) : null,
    data.electricity_consumer_no ?? null,
    data.co_applicant_name ?? null,
    data.co_applicant_relation ?? null,
    data.applied_date ?? null,
    data.sanction_date ?? null,
    data.disbursal_date ?? null,
    data.first_emi_date ?? null,
    data.bank_query_remarks ?? null,
    data.internal_notes ?? null,
    data.sanction_letter_url ?? null,
    id,
  ];

  await db.query(query, values);
  return getLoanById(id, db);
};

// 8. Delete Loan
const deleteLoan = async (id, db = defaultDb) => {
  await ensureLoanTables(db);
  await db.query(`DELETE FROM solar_loans WHERE id = ?`, [id]);
  return { success: true };
};

// 9. Document Upload
const uploadLoanDoc = async ({ loan_id, lead_id, doc_type, file_name, file_url }, db = defaultDb) => {
  await ensureLoanTables(db);
  const query = `
    INSERT INTO loan_documents (loan_id, lead_id, doc_type, file_name, file_url, verification_status)
    VALUES (?, ?, ?, ?, ?, 'Verified')
  `;
  const [res] = await db.query(query, [loan_id, lead_id, doc_type, file_name, file_url]);
  return { id: res.insertId, loan_id, lead_id, doc_type, file_name, file_url, verification_status: "Verified" };
};

module.exports = {
  ensureLoanTables,
  createLoan,
  getLoanById,
  getLoanByLeadId,
  getLoanByProjectId,
  getAllLoans,
  getLoanStats,
  updateLoan,
  deleteLoan,
  uploadLoanDoc,
  calculateMonthlyEMI,
};

