const { db: defaultDb } = require("../config/db");
const crypto = require("crypto");

// Auto-ensure invoices and invoice_payments tables exist
const ensureInvoiceTables = async (db = defaultDb) => {
  const sqlInvoices = `
    CREATE TABLE IF NOT EXISTS invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_number VARCHAR(50) NOT NULL UNIQUE,
      public_token VARCHAR(64) NOT NULL UNIQUE,
      quotation_id INT DEFAULT NULL,
      lead_id INT DEFAULT NULL,
      customer_name VARCHAR(150) NOT NULL,
      customer_email VARCHAR(150) DEFAULT NULL,
      customer_phone VARCHAR(20) NOT NULL,
      customer_address TEXT DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      pincode VARCHAR(20) DEFAULT NULL,
      customer_gstin VARCHAR(50) DEFAULT NULL,
      
      system_capacity_kw DECIMAL(6,2) NOT NULL DEFAULT 1.00,
      system_type VARCHAR(50) DEFAULT 'On-Grid',
      panel_specs VARCHAR(255) DEFAULT 'Mono PERC 550W Half-Cut',
      inverter_specs VARCHAR(255) DEFAULT 'Solar Grid-Tied Inverter',
      structure_type VARCHAR(100) DEFAULT 'Elevated GI High-Grade Structure',
      
      base_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      installation_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      gst_rate DECIMAL(5,2) NOT NULL DEFAULT 13.80,
      cgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      sgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      igst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      gross_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      subsidy_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      net_payable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      
      amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      balance_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      payment_status ENUM('Paid', 'Partially Paid', 'Unpaid') NOT NULL DEFAULT 'Unpaid',
      payment_mode VARCHAR(50) DEFAULT 'Bank Transfer',
      payment_reference VARCHAR(100) DEFAULT NULL,
      payment_date DATE DEFAULT NULL,
      
      invoice_date DATE NOT NULL,
      due_date DATE DEFAULT NULL,
      line_items JSON DEFAULT NULL,
      terms_and_conditions TEXT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Issued',
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_inv_quotation (quotation_id),
      KEY idx_inv_lead (lead_id),
      KEY idx_inv_status (payment_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const sqlPayments = `
    CREATE TABLE IF NOT EXISTS invoice_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode VARCHAR(50) DEFAULT 'Bank Transfer',
      reference_number VARCHAR(100) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      recorded_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_pay_invoice (invoice_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await db.query(sqlInvoices);
    await db.query(sqlPayments);
  } catch (err) {
    console.error("ensureInvoiceTables error:", err.message);
  }
};

// Auto-run on module load
ensureInvoiceTables().catch(() => { });

// Generate unique Invoice Number: INV-YEAR-SEQ
const generateInvoiceNumber = async (db = defaultDb) => {
  const year = new Date().getFullYear();
  const [rows] = await db.query(
    `SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1`
  );
  let nextSeq = 1001;
  if (rows.length > 0 && rows[0].invoice_number) {
    const parts = rows[0].invoice_number.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }
  return `INV-${year}-${nextSeq}`;
};

// Create Invoice
const createInvoice = async (data, createdBy = null, db = defaultDb) => {
  await ensureInvoiceTables(db);
  const invoiceNumber = data.invoice_number || (await generateInvoiceNumber(db));
  const publicToken = crypto.randomBytes(24).toString("hex");

  const numBase = parseFloat(data.base_amount) || 0;
  const numInstall = parseFloat(data.installation_amount) || 0;
  const numDiscount = parseFloat(data.discount_amount) || 0;
  const numGstRate = parseFloat(data.gst_rate) || 13.80;
  const numSubsidy = parseFloat(data.subsidy_amount) || 0;

  const taxableAmount = Math.max(0, numBase + numInstall - numDiscount);
  const gstAmount = Math.round((taxableAmount * numGstRate) / 100);
  const halfGst = Math.round(gstAmount / 2);
  const grossTotal = taxableAmount + gstAmount;
  const netPayable = Math.max(0, grossTotal - numSubsidy);

  const amountPaid = parseFloat(data.amount_paid) || 0;
  const balanceDue = Math.max(0, netPayable - amountPaid);

  let paymentStatus = "Unpaid";
  if (balanceDue === 0 && amountPaid > 0) {
    paymentStatus = "Paid";
  } else if (amountPaid > 0 && balanceDue > 0) {
    paymentStatus = "Partially Paid";
  }

  const invoiceDate = data.invoice_date || new Date().toISOString().split("T")[0];
  let dueDate = data.due_date || null;
  if (!dueDate) {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    dueDate = d.toISOString().split("T")[0];
  }

  const sql = `
    INSERT INTO invoices (
      invoice_number, public_token, quotation_id, lead_id,
      customer_name, customer_email, customer_phone, customer_address,
      city, state, pincode, customer_gstin,
      system_capacity_kw, system_type, panel_specs, inverter_specs, structure_type,
      base_amount, installation_amount, discount_amount, taxable_amount,
      gst_rate, cgst_amount, sgst_amount, igst_amount, gst_amount,
      gross_total, subsidy_amount, net_payable_amount,
      amount_paid, balance_due, payment_status, payment_mode, payment_reference, payment_date,
      invoice_date, due_date, line_items, terms_and_conditions, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    invoiceNumber,
    publicToken,
    data.quotation_id || null,
    data.lead_id || null,
    data.customer_name,
    data.customer_email || null,
    data.customer_phone,
    data.customer_address || null,
    data.city || null,
    data.state || null,
    data.pincode || null,
    data.customer_gstin || null,
    parseFloat(data.system_capacity_kw) || 1.0,
    data.system_type || "On-Grid",
    data.panel_specs || "Mono PERC 550W Half-Cut",
    data.inverter_specs || "Solar Grid-Tied Inverter",
    data.structure_type || "Elevated GI High-Grade Structure",
    numBase,
    numInstall,
    numDiscount,
    taxableAmount,
    numGstRate,
    halfGst,
    halfGst,
    0, // igst
    gstAmount,
    grossTotal,
    numSubsidy,
    netPayable,
    amountPaid,
    balanceDue,
    data.payment_status || paymentStatus,
    data.payment_mode || "Bank Transfer",
    data.payment_reference || null,
    data.payment_date || (amountPaid > 0 ? invoiceDate : null),
    invoiceDate,
    dueDate,
    data.line_items ? JSON.stringify(data.line_items) : null,
    data.terms_and_conditions || null,
    data.notes || null,
    createdBy,
  ];

  const [result] = await db.query(sql, values);
  const invoiceId = result.insertId;

  // If initial payment was made, record in invoice_payments
  if (amountPaid > 0) {
    await db.query(
      `INSERT INTO invoice_payments (invoice_id, amount, payment_date, payment_mode, reference_number, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        amountPaid,
        data.payment_date || invoiceDate,
        data.payment_mode || "Bank Transfer",
        data.payment_reference || "Initial Advance Payment",
        data.notes || "Initial payment on invoice creation",
        createdBy,
      ]
    );
  }

  // Update lead activity log if lead_id exists
  if (data.lead_id) {
    try {
      await db.query(
        `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark, performed_by) VALUES (?, 'Invoice Created', ?, ?, ?)`,
        [
          data.lead_id,
          invoiceNumber,
          `Invoice ${invoiceNumber} created for ₹${netPayable.toLocaleString("en-IN")}. Paid: ₹${amountPaid.toLocaleString("en-IN")}`,
          createdBy,
        ]
      );
    } catch (e) {
      console.warn("Lead activity log error:", e.message);
    }
  }

  return {
    id: invoiceId,
    invoice_number: invoiceNumber,
    public_token: publicToken,
    net_payable_amount: netPayable,
    amount_paid: amountPaid,
    balance_due: balanceDue,
    payment_status: data.payment_status || paymentStatus,
  };
};

// Get Invoices List
const getInvoices = async (filters = {}, db = defaultDb) => {
  await ensureInvoiceTables(db);
  const { search, payment_status, lead_id, quotation_id } = filters;
  let sql = `
    SELECT inv.*, l.lead_code, u.full_name AS created_by_name
    FROM invoices inv
    LEFT JOIN leads l ON inv.lead_id = l.id
    LEFT JOIN users u ON inv.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (payment_status && payment_status !== "All") {
    sql += ` AND inv.payment_status = ?`;
    params.push(payment_status);
  }

  if (lead_id) {
    sql += ` AND inv.lead_id = ?`;
    params.push(lead_id);
  }

  if (quotation_id) {
    sql += ` AND inv.quotation_id = ?`;
    params.push(quotation_id);
  }

  if (search) {
    sql += ` AND (inv.invoice_number LIKE ? OR inv.customer_name LIKE ? OR inv.customer_phone LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY inv.created_at DESC LIMIT 150`;

  const [rows] = await db.query(sql, params);
  return rows;
};

// Get Single Invoice with payment ledger
const getInvoiceById = async (id, db = defaultDb) => {
  await ensureInvoiceTables(db);
  const [rows] = await db.query(
    `SELECT inv.*, l.lead_code, q.quotation_number, u.full_name AS created_by_name
     FROM invoices inv
     LEFT JOIN leads l ON inv.lead_id = l.id
     LEFT JOIN quotations q ON inv.quotation_id = q.id
     LEFT JOIN users u ON inv.created_by = u.id
     WHERE inv.id = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) return null;

  const invoice = rows[0];
  const [payments] = await db.query(
    `SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC`,
    [id]
  );
  invoice.payments = payments;
  return invoice;
};

// Get Public Invoice by Token
const getInvoiceByToken = async (token, db = defaultDb) => {
  await ensureInvoiceTables(db);
  const [rows] = await db.query(
    `SELECT inv.*, q.quotation_number
     FROM invoices inv
     LEFT JOIN quotations q ON inv.quotation_id = q.id
     WHERE inv.public_token = ? OR inv.invoice_number = ? OR inv.id = ?
     LIMIT 1`,
    [token, token, isNaN(token) ? 0 : parseInt(token, 10)]
  );
  if (rows.length === 0) return null;

  const invoice = rows[0];
  const [payments] = await db.query(
    `SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC`,
    [invoice.id]
  );
  invoice.payments = payments;
  return invoice;
};

// Record additional payment on an invoice
const recordPayment = async (invoiceId, paymentData, userId = null, db = defaultDb) => {
  await ensureInvoiceTables(db);
  const [invRows] = await db.query(`SELECT * FROM invoices WHERE id = ? LIMIT 1`, [invoiceId]);
  if (invRows.length === 0) throw new Error("Invoice not found");

  const inv = invRows[0];
  const newPaymentAmount = parseFloat(paymentData.amount) || 0;
  if (newPaymentAmount <= 0) throw new Error("Payment amount must be greater than zero");

  const newTotalPaid = parseFloat(inv.amount_paid) + newPaymentAmount;
  const newBalanceDue = Math.max(0, parseFloat(inv.net_payable_amount) - newTotalPaid);

  let newStatus = "Partially Paid";
  if (newBalanceDue === 0) {
    newStatus = "Paid";
  }

  const paymentDate = paymentData.payment_date || new Date().toISOString().split("T")[0];

  // Insert payment ledger record
  await db.query(
    `INSERT INTO invoice_payments (invoice_id, amount, payment_date, payment_mode, reference_number, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      invoiceId,
      newPaymentAmount,
      paymentDate,
      paymentData.payment_mode || "Bank Transfer",
      paymentData.reference_number || null,
      paymentData.notes || null,
      userId,
    ]
  );

  // Update invoice balance and status
  await db.query(
    `UPDATE invoices SET
       amount_paid = ?,
       balance_due = ?,
       payment_status = ?,
       payment_date = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [newTotalPaid, newBalanceDue, newStatus, paymentDate, invoiceId]
  );

  // Log in lead activity
  if (inv.lead_id) {
    try {
      await db.query(
        `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark, performed_by) VALUES (?, 'Payment Received', ?, ?, ?)`,
        [
          inv.lead_id,
          `₹${newPaymentAmount.toLocaleString("en-IN")}`,
          `Payment of ₹${newPaymentAmount.toLocaleString("en-IN")} received against Invoice ${inv.invoice_number}. Balance due: ₹${newBalanceDue.toLocaleString("en-IN")}`,
          userId,
        ]
      );
    } catch (e) { }
  }

  return {
    invoice_id: invoiceId,
    amount_paid: newTotalPaid,
    balance_due: newBalanceDue,
    payment_status: newStatus,
  };
};

module.exports = {
  ensureInvoiceTables,
  generateInvoiceNumber,
  createInvoice,
  getInvoices,
  getInvoiceById,
  getInvoiceByToken,
  recordPayment,
};
