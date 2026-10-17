const { db: defaultDb } = require("../config/db");

// Auto-ensure customers table exists in any client database
const ensureCustomerTables = async (db = defaultDb) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_code VARCHAR(30) NOT NULL UNIQUE,
        lead_id INT DEFAULT NULL,
        customer_name VARCHAR(150) NOT NULL,
        mobile_number VARCHAR(20) NOT NULL,
        alternate_number VARCHAR(20) DEFAULT NULL,
        email VARCHAR(150) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        city VARCHAR(100) DEFAULT NULL,
        state VARCHAR(100) DEFAULT NULL,
        pincode VARCHAR(20) DEFAULT NULL,
        electricity_consumer_number VARCHAR(100) DEFAULT NULL,
        discom_name VARCHAR(100) DEFAULT NULL,
        sanctioned_load_kw DECIMAL(8,2) DEFAULT NULL,
        customer_gstin VARCHAR(50) DEFAULT NULL,
        solar_requirement ENUM('Residential','Commercial','Industrial') NOT NULL DEFAULT 'Residential',
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        notes TEXT DEFAULT NULL,
        assigned_to INT DEFAULT NULL,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_cust_phone (mobile_number),
        KEY idx_cust_code (customer_code),
        KEY idx_cust_lead (lead_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure customer_id column in leads, projects, quotations, invoices
    const addColIfMissing = async (table, col, colDef) => {
      try {
        const [rows] = await db.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [table, col]
        );
        if (rows.length === 0) {
          await db.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${colDef}`);
        }
      } catch (e) {
        // silently ignore if table does not exist yet
      }
    };

    await addColIfMissing("leads", "customer_id", "INT DEFAULT NULL");
    await addColIfMissing("projects", "customer_id", "INT DEFAULT NULL");
    await addColIfMissing("quotations", "customer_id", "INT DEFAULT NULL");
    await addColIfMissing("invoices", "customer_id", "INT DEFAULT NULL");

    // Automatically sync any past Won leads that don't have customer records yet
    await autoSyncWonLeads(db);
  } catch (err) {
    console.error("ensureCustomerTables error:", err.message);
  }
};

// Auto-sync past Won leads into customers table (Runs safely without duplicates)
const autoSyncWonLeads = async (db = defaultDb) => {
  try {
    const [wonLeads] = await db.query(
      `SELECT id, customer_name, mobile_number, alternate_number, email, address,
              city, state, pincode, solar_requirement, assigned_to, created_by,
              lead_code, customer_id
       FROM leads
       WHERE LOWER(status) = 'won' AND is_deleted = 0
       ORDER BY id ASC`
    );

    for (const lead of wonLeads) {
      const rawPhone = (lead.mobile_number || "").trim();
      const cleanDigits = rawPhone.replace(/\D/g, "");
      const phone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : rawPhone;

      // 1. Check if customer already exists for this lead or phone
      const [existing] = await db.query(
        `SELECT id, customer_code FROM customers
         WHERE lead_id = ?
            OR (id = ? AND ? IS NOT NULL)
            OR (mobile_number = ? AND ? != '')
            OR (mobile_number LIKE ? AND ? != '')
         LIMIT 1`,
        [lead.id, lead.customer_id, lead.customer_id, rawPhone, rawPhone, `%${phone}`, phone]
      );

      let customerId = null;
      let customerCode = null;

      if (existing.length > 0) {
        customerId = existing[0].id;
        customerCode = existing[0].customer_code;
        await db.query(`UPDATE leads SET customer_id = ? WHERE id = ? AND (customer_id IS NULL OR customer_id != ?)`, [customerId, lead.id, customerId]);
      } else {
        customerCode = await generateCustomerCode(db);
        const [ins] = await db.query(
          `INSERT INTO customers (
            customer_code, lead_id, customer_name, mobile_number, alternate_number,
            email, address, city, state, pincode, solar_requirement,
            assigned_to, created_by, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            customerCode,
            lead.id,
            lead.customer_name || "Existing Customer",
            rawPhone || phone || "0000000000",
            lead.alternate_number || null,
            lead.email || null,
            lead.address || null,
            lead.city || null,
            lead.state || null,
            lead.pincode || null,
            lead.solar_requirement || "Residential",
            lead.assigned_to || null,
            lead.created_by || null,
            `Auto-migrated from existing Won Lead (${lead.lead_code || lead.id})`,
          ]
        );
        customerId = ins.insertId;
        await db.query(`UPDATE leads SET customer_id = ? WHERE id = ?`, [customerId, lead.id]);
      }

      // Backlink projects, quotations, invoices
      try {
        await db.query(`UPDATE projects SET customer_id = ? WHERE lead_id = ? AND (customer_id IS NULL OR customer_id != ?)`, [customerId, lead.id, customerId]);
        await db.query(`UPDATE quotations SET customer_id = ? WHERE lead_id = ? AND (customer_id IS NULL OR customer_id != ?)`, [customerId, lead.id, customerId]);
        await db.query(`UPDATE invoices SET customer_id = ? WHERE lead_id = ? AND (customer_id IS NULL OR customer_id != ?)`, [customerId, lead.id, customerId]);
      } catch (backlinkErr) {
        // silent
      }
    }
  } catch (syncErr) {
    console.error("autoSyncWonLeads error:", syncErr.message);
  }
};

// Generate sequential Customer Code: CUST-YYYY-1001
const generateCustomerCode = async (db = defaultDb) => {
  const year = new Date().getFullYear();
  const [rows] = await db.query(
    `SELECT customer_code FROM customers WHERE customer_code LIKE 'CUST-${year}-%' ORDER BY id DESC LIMIT 1`
  );
  let nextSeq = 1001;
  if (rows.length > 0 && rows[0].customer_code) {
    const parts = rows[0].customer_code.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }
  return `CUST-${year}-${nextSeq}`;
};

// Auto-create or link customer from Won Lead
const createOrLinkCustomerFromLead = async (leadId, performedBy = null, db = defaultDb) => {
  try {
    await ensureCustomerTables(db);
    const [leadRows] = await db.query(`SELECT * FROM leads WHERE id = ?`, [leadId]);
    if (leadRows.length === 0) return null;
    const lead = leadRows[0];

    const rawPhone = (lead.mobile_number || "").trim();
    // Normalize phone (strip non-digits, keep last 10 digits for Indian numbers)
    const cleanDigits = rawPhone.replace(/\D/g, "");
    const phone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : rawPhone;

    if (!phone && !lead.customer_name) {
      console.warn(`[CustomerModel] Cannot create customer for lead ${leadId}: Missing phone and name`);
      return null;
    }

    let customerId = null;
    let customerCode = null;

    // 1. Check if lead already has customer_id linked or if customer exists with lead_id
    if (lead.customer_id) {
      const [existingById] = await db.query(
        `SELECT id, customer_code FROM customers WHERE id = ? LIMIT 1`,
        [lead.customer_id]
      );
      if (existingById.length > 0) {
        customerId = existingById[0].id;
        customerCode = existingById[0].customer_code;
      }
    }

    if (!customerId) {
      const [existingByLead] = await db.query(
        `SELECT id, customer_code FROM customers WHERE lead_id = ? LIMIT 1`,
        [leadId]
      );
      if (existingByLead.length > 0) {
        customerId = existingByLead[0].id;
        customerCode = existingByLead[0].customer_code;
      }
    }

    // 2. Check if customer already exists by phone (matching raw or last 10 digits)
    if (!customerId && phone) {
      const [existingByPhone] = await db.query(
        `SELECT id, customer_code FROM customers WHERE mobile_number = ? OR mobile_number LIKE ? LIMIT 1`,
        [rawPhone, `%${phone}`]
      );
      if (existingByPhone.length > 0) {
        customerId = existingByPhone[0].id;
        customerCode = existingByPhone[0].customer_code;
      }
    }

    if (customerId) {
      // Link customer to lead
      await db.query(`UPDATE leads SET customer_id = ? WHERE id = ?`, [customerId, leadId]);
    } else {
      customerCode = await generateCustomerCode(db);
      const [insResult] = await db.query(
        `INSERT INTO customers (
          customer_code, lead_id, customer_name, mobile_number, alternate_number,
          email, address, city, state, pincode, solar_requirement,
          assigned_to, created_by, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerCode,
          leadId,
          lead.customer_name || "Unknown Customer",
          rawPhone || phone || "0000000000",
          lead.alternate_number || null,
          lead.email || null,
          lead.address || null,
          lead.city || null,
          lead.state || null,
          lead.pincode || null,
          lead.solar_requirement || "Residential",
          lead.assigned_to || null,
          performedBy || lead.created_by || null,
          `Auto-created from Won Lead (${lead.lead_code || leadId})`,
        ]
      );
      customerId = insResult.insertId;

      await db.query(`UPDATE leads SET customer_id = ? WHERE id = ?`, [customerId, leadId]);

      // Log in lead activity logs
      try {
        await db.query(
          `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark, performed_by)
           VALUES (?, 'Customer Created', ?, ?, ?)`,
          [
            leadId,
            customerCode,
            `Official customer record created: ${customerCode} (${lead.customer_name})`,
            performedBy,
          ]
        );
      } catch (e) {
        // ignore
      }
    }

    // Also bind any projects, quotations, and invoices of this lead
    try {
      await db.query(`UPDATE projects SET customer_id = ? WHERE lead_id = ?`, [customerId, leadId]);
      await db.query(`UPDATE quotations SET customer_id = ? WHERE lead_id = ?`, [customerId, leadId]);
      await db.query(`UPDATE invoices SET customer_id = ? WHERE lead_id = ?`, [customerId, leadId]);
    } catch (linkErr) {
      console.warn("Could not backlink customer items:", linkErr.message);
    }

    console.log(`[CustomerModel] Successfully linked/created customer ${customerCode} (ID: ${customerId}) for lead ${leadId}`);
    return { customerId, customerCode };
  } catch (err) {
    console.error("[CustomerModel] createOrLinkCustomerFromLead error:", err);
    throw err;
  }
};

// Create Customer Manually
const createCustomer = async (data, userId, db = defaultDb) => {
  await ensureCustomerTables(db);
  const customerCode = await generateCustomerCode(db);

  const [res] = await db.query(
    `INSERT INTO customers (
      customer_code, customer_name, mobile_number, alternate_number, email,
      address, city, state, pincode, electricity_consumer_number, discom_name,
      sanctioned_load_kw, customer_gstin, solar_requirement, notes, assigned_to, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customerCode,
      data.customer_name,
      data.mobile_number,
      data.alternate_number || null,
      data.email || null,
      data.address || null,
      data.city || null,
      data.state || null,
      data.pincode || null,
      data.electricity_consumer_number || null,
      data.discom_name || null,
      data.sanctioned_load_kw || null,
      data.customer_gstin || null,
      data.solar_requirement || "Residential",
      data.notes || null,
      data.assigned_to || null,
      userId || null,
    ]
  );

  return { id: res.insertId, customer_code: customerCode };
};

// Get Customers List with Aggregated Financials & Projects Count
const getCustomers = async (filters = {}, db = defaultDb) => {
  await ensureCustomerTables(db);
  const { search, city, requirement, role_id, user_id } = filters;

  let sql = `
    SELECT 
      c.*,
      u.full_name AS assigned_to_name,
      l.lead_code,
      (
        SELECT COUNT(p.id) 
        FROM projects p 
        WHERE (p.customer_id = c.id OR (p.lead_id = c.lead_id AND p.lead_id IS NOT NULL)) 
          AND p.is_deleted = 0
      ) AS total_projects,
      (
        SELECT COALESCE(SUM(p.system_capacity_kw), 0) 
        FROM projects p 
        WHERE (p.customer_id = c.id OR (p.lead_id = c.lead_id AND p.lead_id IS NOT NULL)) 
          AND p.is_deleted = 0
      ) AS total_system_kw,
      (
        SELECT COALESCE(SUM(inv.gross_total), 0) 
        FROM invoices inv 
        WHERE (inv.customer_id = c.id OR (inv.lead_id = c.lead_id AND inv.lead_id IS NOT NULL))
      ) AS total_billed_amount,
      (
        SELECT COALESCE(SUM(inv.amount_paid), 0) 
        FROM invoices inv 
        WHERE (inv.customer_id = c.id OR (inv.lead_id = c.lead_id AND inv.lead_id IS NOT NULL))
      ) AS total_paid_amount,
      (
        SELECT COALESCE(SUM(inv.balance_due), 0) 
        FROM invoices inv 
        WHERE (inv.customer_id = c.id OR (inv.lead_id = c.lead_id AND inv.lead_id IS NOT NULL))
      ) AS total_balance_amount
    FROM customers c
    LEFT JOIN users u ON c.assigned_to = u.id
    LEFT JOIN leads l ON c.lead_id = l.id
    WHERE 1=1
  `;
  const params = [];

  const roleIdNum = Number(role_id);
  if (roleIdNum === 3) { // Sales sees assigned
    sql += ` AND (c.assigned_to = ? OR c.created_by = ?)`;
    params.push(user_id, user_id);
  } else if (roleIdNum === 2) { // Manager sees team
    sql += ` AND (
      c.assigned_to = ? 
      OR c.assigned_to IN (SELECT id FROM users WHERE manager_id = ?) 
      OR c.created_by = ?
    )`;
    params.push(user_id, user_id, user_id);
  }

  if (city) {
    sql += ` AND c.city = ?`;
    params.push(city);
  }

  if (requirement) {
    sql += ` AND c.solar_requirement = ?`;
    params.push(requirement);
  }

  if (search) {
    sql += ` AND (c.customer_code LIKE ? OR c.customer_name LIKE ? OR c.mobile_number LIKE ? OR c.email LIKE ? OR c.city LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY c.id DESC LIMIT 150`;

  const [rows] = await db.query(sql, params);
  return rows;
};

// Get Full 360° Customer Profile By ID
const getCustomerById = async (id, db = defaultDb) => {
  await ensureCustomerTables(db);

  const [customerRows] = await db.query(
    `SELECT c.*, u.full_name AS assigned_to_name, uc.full_name AS created_by_name, l.lead_code
     FROM customers c
     LEFT JOIN users u ON c.assigned_to = u.id
     LEFT JOIN users uc ON c.created_by = uc.id
     LEFT JOIN leads l ON c.lead_id = l.id
     WHERE c.id = ?`,
    [id]
  );

  if (customerRows.length === 0) return null;
  const customer = customerRows[0];

  const leadId = customer.lead_id;

  // 1. Projects
  const [projects] = await db.query(
    `SELECT p.*, u.full_name AS assigned_to_name 
     FROM projects p 
     LEFT JOIN users u ON p.assigned_to = u.id 
     WHERE (p.customer_id = ? OR (p.lead_id = ? AND ? IS NOT NULL)) AND p.is_deleted = 0
     ORDER BY p.id DESC`,
    [id, leadId, leadId]
  );

  // 2. Quotations
  const [quotations] = await db.query(
    `SELECT q.*, u.full_name AS created_by_name 
     FROM quotations q 
     LEFT JOIN users u ON q.created_by = u.id 
     WHERE (q.customer_id = ? OR (q.lead_id = ? AND ? IS NOT NULL))
     ORDER BY q.id DESC`,
    [id, leadId, leadId]
  );

  // 3. Invoices & Payments
  const [invoices] = await db.query(
    `SELECT inv.*, u.full_name AS created_by_name 
     FROM invoices inv 
     LEFT JOIN users u ON inv.created_by = u.id 
     WHERE (inv.customer_id = ? OR (inv.lead_id = ? AND ? IS NOT NULL))
     ORDER BY inv.id DESC`,
    [id, leadId, leadId]
  );

  // 4. Leads History
  const [leads] = await db.query(
    `SELECT l.*, u.full_name AS assigned_to_name 
     FROM leads l 
     LEFT JOIN users u ON l.assigned_to = u.id 
     WHERE (l.customer_id = ? OR l.id = ?) AND l.is_deleted = 0
     ORDER BY l.id DESC`,
    [id, leadId]
  );

  return {
    ...customer,
    projects,
    quotations,
    invoices,
    leads,
  };
};

// Update Customer Profile
const updateCustomer = async (id, data, db = defaultDb) => {
  await ensureCustomerTables(db);
  const [result] = await db.query(
    `UPDATE customers SET
      customer_name = ?,
      mobile_number = ?,
      alternate_number = ?,
      email = ?,
      address = ?,
      city = ?,
      state = ?,
      pincode = ?,
      electricity_consumer_number = ?,
      discom_name = ?,
      sanctioned_load_kw = ?,
      customer_gstin = ?,
      solar_requirement = ?,
      status = ?,
      notes = ?,
      assigned_to = ?
     WHERE id = ?`,
    [
      data.customer_name,
      data.mobile_number,
      data.alternate_number || null,
      data.email || null,
      data.address || null,
      data.city || null,
      data.state || null,
      data.pincode || null,
      data.electricity_consumer_number || null,
      data.discom_name || null,
      data.sanctioned_load_kw || null,
      data.customer_gstin || null,
      data.solar_requirement || "Residential",
      data.status || "Active",
      data.notes || null,
      data.assigned_to || null,
      id,
    ]
  );
  return result;
};

// Delete Customer (Super Admin only)
const deleteCustomer = async (id, db = defaultDb) => {
  await ensureCustomerTables(db);
  const [result] = await db.query(`DELETE FROM customers WHERE id = ?`, [id]);
  return result;
};

module.exports = {
  ensureCustomerTables,
  autoSyncWonLeads,
  generateCustomerCode,
  createOrLinkCustomerFromLead,
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
