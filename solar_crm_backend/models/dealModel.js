const { db: defaultDb } = require("../config/db");

// Auto-ensure project_orders table exists
const ensureDealTable = async (db = defaultDb) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS project_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lead_id INT NOT NULL,
      quotation_id INT DEFAULT NULL,
      order_number VARCHAR(50) NOT NULL UNIQUE,
      total_project_cost DECIMAL(12, 2) NOT NULL,
      advance_payment_amount DECIMAL(12, 2) NOT NULL,
      advance_payment_date DATETIME NOT NULL,
      payment_mode VARCHAR(50) DEFAULT 'bank_transfer',
      payment_reference VARCHAR(100) DEFAULT NULL,
      dealer_id INT DEFAULT NULL,
      dealer_commission DECIMAL(10, 2) DEFAULT 0,
      order_status VARCHAR(50) DEFAULT 'booked',
      contract_signed_at DATETIME DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );
  `;
  try {
    await db.query(sql);
    try {
      await db.query(`ALTER TABLE leads MODIFY COLUMN status VARCHAR(100) NOT NULL DEFAULT 'New Lead'`);
    } catch (e) {}
  } catch (err) {
    console.error("ensureDealTable error:", err);
  }
};

ensureDealTable().catch(() => {});

// Generate unique Order Number ORD-YEAR-SEQ
const generateOrderNumber = async (db = defaultDb) => {
  const year = new Date().getFullYear();
  const [rows] = await db.query(
    `SELECT order_number FROM project_orders ORDER BY id DESC LIMIT 1`
  );
  let nextSeq = 1001;
  if (rows.length > 0 && rows[0].order_number) {
    const parts = rows[0].order_number.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }
  return `ORD-${year}-${nextSeq}`;
};

// 1. Close Order & Mark Deal Won
const closeOrder = async (data, createdBy, db = defaultDb) => {
  await ensureDealTable(db);
  const {
    lead_id,
    quotation_id,
    total_project_cost,
    advance_payment_amount,
    advance_payment_date,
    payment_mode,
    payment_reference,
    dealer_id,
    dealer_commission,
    notes,
  } = data;

  const parseNum = (val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const cost = parseNum(total_project_cost);
  const advance = parseNum(advance_payment_amount);
  const commission = parseNum(dealer_commission);
  const dealerId = dealer_id && !isNaN(Number(dealer_id)) ? Number(dealer_id) : null;
  const quoId = quotation_id && !isNaN(Number(quotation_id)) ? Number(quotation_id) : null;
  const payDate = advance_payment_date ? new Date(advance_payment_date) : new Date();

  // Check if order already exists for this lead
  const [existing] = await db.query(
    `SELECT id, order_number FROM project_orders WHERE lead_id = ? LIMIT 1`,
    [lead_id]
  );

  let orderId;
  let orderNum;

  if (existing.length > 0) {
    orderId = existing[0].id;
    orderNum = existing[0].order_number;
    await db.query(
      `
      UPDATE project_orders SET
        quotation_id = ?,
        total_project_cost = ?,
        advance_payment_amount = ?,
        advance_payment_date = ?,
        payment_mode = ?,
        payment_reference = ?,
        dealer_id = ?,
        dealer_commission = ?,
        contract_signed_at = CURRENT_TIMESTAMP,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        quoId,
        cost,
        advance,
        payDate,
        payment_mode || "bank_transfer",
        payment_reference || null,
        dealerId,
        commission,
        notes || null,
        orderId,
      ]
    );
  } else {
    orderNum = await generateOrderNumber(db);
    const [res] = await db.query(
      `
      INSERT INTO project_orders (
        lead_id, quotation_id, order_number, total_project_cost,
        advance_payment_amount, advance_payment_date, payment_mode,
        payment_reference, dealer_id, dealer_commission, order_status,
        contract_signed_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'booked', CURRENT_TIMESTAMP, ?)
      `,
      [
        lead_id,
        quoId,
        orderNum,
        cost,
        advance,
        payDate,
        payment_mode || "bank_transfer",
        payment_reference || null,
        dealerId,
        commission,
        notes || null,
      ]
    );
    orderId = res.insertId;
  }

  // Update lead status to 'Deal Won' and update quotation_amount
  try {
    await db.query(
      `UPDATE leads SET status = 'Deal Won', quotation_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [cost, lead_id]
    );
  } catch (err) {
    console.warn("Failed to set status 'Deal Won', falling back to 'Won':", err.message);
    try {
      await db.query(
        `UPDATE leads SET status = 'Won', quotation_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [cost, lead_id]
      );
    } catch (e) {}
  }

  // Log activity
  try {
    await db.query(
      `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark) VALUES (?, 'Status Changed', 'Deal Won', ?)`,
      [
        lead_id,
        `Order ${orderNum} Booked! Total: ₹${cost.toLocaleString("en-IN")}, Advance: ₹${advance.toLocaleString("en-IN")} via ${payment_mode || "Bank Transfer"} (Ref: ${payment_reference || "N/A"})`,
      ]
    );
  } catch (err) {
    console.error("Failed to log deal order activity:", err);
  }

  return getOrderByLeadId(lead_id, db);
};

// 2. Get Order Details by Lead ID
const getOrderByLeadId = async (leadId, db = defaultDb) => {
  await ensureDealTable(db);
  const [rows] = await db.query(
    `
    SELECT o.*,
           l.lead_code, l.customer_name, l.mobile_number, l.address, l.city, l.state, l.required_kw,
           u.full_name AS dealer_name, u.email AS dealer_email, u.phone AS dealer_phone,
           q.quotation_number
    FROM project_orders o
    LEFT JOIN leads l ON o.lead_id = l.id
    LEFT JOIN users u ON o.dealer_id = u.id
    LEFT JOIN quotations q ON o.quotation_id = q.id
    WHERE o.lead_id = ?
    LIMIT 1
    `,
    [leadId]
  );
  return rows.length > 0 ? rows[0] : null;
};

module.exports = {
  ensureDealTable,
  closeOrder,
  getOrderByLeadId,
};
