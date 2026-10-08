const crypto = require("crypto");
const { db: defaultDb } = require("../config/db");

// Helper function to generate unique quotation number
const generateQuotationNumber = async (db) => {
  const year = new Date().getFullYear();
  const [rows] = await db.query(
    `SELECT quotation_number FROM quotations ORDER BY id DESC LIMIT 1`
  );
  let nextSeq = 1001;
  if (rows.length > 0 && rows[0].quotation_number) {
    const parts = rows[0].quotation_number.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }
  return `QUO-${year}-${nextSeq}`;
};

// ============================================================
// 1. CREATE QUOTATION
// POST /api/quotations
// ============================================================
const createQuotation = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const userId = req.user?.id || null;

    const {
      lead_id,
      calculation_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      city,
      state,
      pincode,
      system_capacity_kw,
      system_type = "On-Grid",
      panel_brand = "Waaree Mono PERC",
      panel_type = "Mono PERC 550W Half-Cut",
      panel_count,
      inverter_brand = "Growatt / Solis",
      inverter_capacity_kw,
      structure_type = "Elevated GI High-Grade Structure",
      battery_capacity_ah = null,
      base_price = 0,
      structure_installation_cost = 0,
      gst_rate = 13.80,
      discount_amount = 0,
      subsidy_amount = 0,
      annual_generation_kwh = 0,
      annual_savings = 0,
      payback_years = 0,
      twenty_five_year_savings = 0,
      valid_until = null,
      terms_and_conditions = null,
      notes = null,
    } = req.body;

    if (!customer_name || !customer_phone || !system_capacity_kw) {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone, and system capacity are required.",
      });
    }

    const quotationNumber = await generateQuotationNumber(db);
    const publicToken = crypto.randomBytes(24).toString("hex");

    // Commercial calculation
    const numBasePrice = parseFloat(base_price) || 0;
    const numStructureCost = parseFloat(structure_installation_cost) || 0;
    const numDiscount = parseFloat(discount_amount) || 0;
    const numGstRate = parseFloat(gst_rate) || 13.80;
    const numSubsidy = parseFloat(subsidy_amount) || 0;

    const subtotalBeforeGst = Math.max(0, (numBasePrice + numStructureCost) - numDiscount);
    const gstAmount = Math.round((subtotalBeforeGst * numGstRate) / 100);
    const totalAmount = Math.round(subtotalBeforeGst + gstAmount);
    const netPayableAmount = Math.max(0, totalAmount - numSubsidy);

    const calculatedPanelCount = parseInt(panel_count, 10) || Math.ceil((parseFloat(system_capacity_kw) * 1000) / 550);
    const calculatedInverterKw = parseFloat(inverter_capacity_kw) || parseFloat(system_capacity_kw);

    const sql = `
      INSERT INTO quotations (
        quotation_number, public_token, lead_id, calculation_id,
        customer_name, customer_email, customer_phone, customer_address, city, state, pincode,
        system_capacity_kw, system_type, panel_brand, panel_type, panel_count,
        inverter_brand, inverter_capacity_kw, structure_type, battery_capacity_ah,
        base_price, structure_installation_cost, gst_rate, gst_amount, discount_amount,
        total_amount, subsidy_amount, net_payable_amount,
        annual_generation_kwh, annual_savings, payback_years, twenty_five_year_savings,
        status, valid_until, terms_and_conditions, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Sent', ?, ?, ?, ?)
    `;

    const values = [
      quotationNumber,
      publicToken,
      lead_id || null,
      calculation_id || null,
      customer_name,
      customer_email || null,
      customer_phone,
      customer_address || null,
      city || null,
      state || null,
      pincode || null,
      system_capacity_kw,
      system_type,
      panel_brand,
      panel_type,
      calculatedPanelCount,
      inverter_brand,
      calculatedInverterKw,
      structure_type,
      battery_capacity_ah || null,
      numBasePrice,
      numStructureCost,
      numGstRate,
      gstAmount,
      numDiscount,
      totalAmount,
      numSubsidy,
      netPayableAmount,
      annual_generation_kwh,
      annual_savings,
      payback_years,
      twenty_five_year_savings,
      valid_until || null,
      terms_and_conditions || null,
      notes || null,
      userId,
    ];

    const [result] = await db.query(sql, values);
    const quotationId = result.insertId;

    // Update Lead if linked
    if (lead_id) {
      await db.query(
        `UPDATE leads SET quotation_amount = ?, status = 'Quotation Sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [netPayableAmount, lead_id]
      );

      await db.query(
        `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark, performed_by) VALUES (?, 'Quotation Sent', ?, ?, ?)`,
        [lead_id, quotationNumber, `Quotation of ₹${netPayableAmount.toLocaleString("en-IN")} generated`, userId]
      );
    }

    return res.status(201).json({
      success: true,
      message: "Quotation generated successfully",
      data: {
        id: quotationId,
        quotation_number: quotationNumber,
        public_token: publicToken,
        net_payable_amount: netPayableAmount,
        public_url: `/quote/${publicToken}`,
      },
    });
  } catch (err) {
    console.error("createQuotation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate quotation",
      error: err.message,
    });
  }
};

// ============================================================
// 2. GET ALL QUOTATIONS (CRM Admin/Manager/Sales)
// GET /api/quotations
// ============================================================
const getQuotations = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { lead_id, search, status } = req.query;

    let sql = `
      SELECT q.*, l.lead_code, u.full_name AS created_by_name
      FROM quotations q
      LEFT JOIN leads l ON q.lead_id = l.id
      LEFT JOIN users u ON q.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (lead_id) {
      sql += ` AND q.lead_id = ?`;
      params.push(lead_id);
    }

    if (status) {
      sql += ` AND q.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (q.quotation_number LIKE ? OR q.customer_name LIKE ? OR q.customer_phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY q.created_at DESC LIMIT 100`;

    const [rows] = await db.query(sql, params);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getQuotations error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotations",
      error: err.message,
    });
  }
};

// ============================================================
// 3. GET QUOTATION BY ID (CRM View)
// GET /api/quotations/:id
// ============================================================
const getQuotationById = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT q.*, l.lead_code FROM quotations q LEFT JOIN leads l ON q.lead_id = l.id WHERE q.id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.error("getQuotationById error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation details",
      error: err.message,
    });
  }
};

// ============================================================
// 4. GET PUBLIC QUOTATION BY TOKEN (Public Link /quote/:token)
// GET /api/public/quotations/:token
// ============================================================
const getPublicQuotation = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { token } = req.params;

    // Support lookup by public_token OR numeric id OR quotation_number
    const [rows] = await db.query(
      `SELECT * FROM quotations WHERE public_token = ? OR id = ? OR quotation_number = ? LIMIT 1`,
      [token, isNaN(token) ? 0 : parseInt(token, 10), token]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found or link has expired.",
      });
    }

    const quotation = rows[0];

    // Safely mark as viewed
    try {
      if (!quotation.viewed_at) {
        await db.query(
          `UPDATE quotations SET viewed_at = NOW() WHERE id = ?`,
          [quotation.id]
        );
      }
    } catch (vErr) {
      console.warn("Could not update viewed_at:", vErr.message);
    }

    // Safely fetch company settings with SELECT *
    let companySettings = {
      company_name: "Solar CRM Partner",
      company_email: "support@solarcrm.com",
      company_phone: "+91 98765 43210",
    };
    try {
      const [settingsRows] = await db.query(`SELECT * FROM settings LIMIT 1`);
      if (settingsRows.length > 0) {
        companySettings = {
          ...companySettings,
          ...settingsRows[0],
        };
      }
    } catch (sErr) {
      console.warn("Could not fetch settings:", sErr.message);
    }

    return res.json({
      success: true,
      data: {
        quotation,
        company: companySettings,
      },
    });
  } catch (err) {
    console.error("getPublicQuotation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load public quotation",
      error: err.message,
    });
  }
};

// ============================================================
// 5. ACCEPT PUBLIC QUOTATION ONLINE
// POST /api/public/quotations/:token/accept
// ============================================================
const acceptPublicQuotation = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { token } = req.params;
    const { customer_signature_name } = req.body;

    const [rows] = await db.query(
      `SELECT * FROM quotations WHERE public_token = ? OR id = ? OR quotation_number = ? LIMIT 1`,
      [token, isNaN(token) ? 0 : parseInt(token, 10), token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    const quotation = rows[0];

    if (quotation.status === "Accepted") {
      return res.json({
        success: true,
        message: "Quotation has already been accepted.",
        data: quotation,
      });
    }

    const sigName = customer_signature_name || quotation.customer_name;

    await db.query(
      `UPDATE quotations SET status = 'Accepted', accepted_at = NOW(), customer_signature_name = ? WHERE id = ?`,
      [sigName, quotation.id]
    );

    // If linked to a lead, update lead status to Won
    if (quotation.lead_id) {
      try {
        await db.query(
          `UPDATE leads SET status = 'Won', closed_at = NOW(), updated_at = NOW() WHERE id = ?`,
          [quotation.lead_id]
        );

        await db.query(
          `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark) VALUES (?, 'Status Changed', 'Won', ?)`,
          [quotation.lead_id, `Quotation ${quotation.quotation_number} accepted online by ${sigName}`]
        );
      } catch (lErr) {
        console.warn("Lead status update warning:", lErr.message);
      }
    }

    return res.json({
      success: true,
      message: "Congratulations! Quotation has been accepted successfully.",
      data: {
        ...quotation,
        status: "Accepted",
        accepted_at: new Date(),
        customer_signature_name: sigName,
      },
    });
  } catch (err) {
    console.error("acceptPublicQuotation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to accept quotation",
      error: err.message,
    });
  }
};

// ============================================================
// 6. UPDATE QUOTATION DETAILS & PRICING (CRM Admin/Manager)
// PUT /api/quotations/:id
// ============================================================
const updateQuotation = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    const [existingRows] = await db.query(`SELECT * FROM quotations WHERE id = ? LIMIT 1`, [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    const current = existingRows[0];

    const customer_name = req.body.customer_name ?? current.customer_name;
    const customer_email = req.body.customer_email ?? current.customer_email;
    const customer_phone = req.body.customer_phone ?? current.customer_phone;
    const customer_address = req.body.customer_address ?? current.customer_address;
    const city = req.body.city ?? current.city;
    const state = req.body.state ?? current.state;
    const pincode = req.body.pincode ?? current.pincode;

    const system_capacity_kw = req.body.system_capacity_kw ?? current.system_capacity_kw;
    const system_type = req.body.system_type ?? current.system_type;
    const panel_brand = req.body.panel_brand ?? current.panel_brand;
    const panel_type = req.body.panel_type ?? current.panel_type;
    const panel_count = req.body.panel_count ?? current.panel_count;
    const inverter_brand = req.body.inverter_brand ?? current.inverter_brand;
    const inverter_capacity_kw = req.body.inverter_capacity_kw ?? current.inverter_capacity_kw;
    const structure_type = req.body.structure_type ?? current.structure_type;

    const numBasePrice = parseFloat(req.body.base_price ?? current.base_price) || 0;
    const numStructureCost = parseFloat(req.body.structure_installation_cost ?? current.structure_installation_cost) || 0;
    const numDiscount = parseFloat(req.body.discount_amount ?? current.discount_amount) || 0;
    const numGstRate = parseFloat(req.body.gst_rate ?? current.gst_rate) || 13.80;
    const numSubsidy = parseFloat(req.body.subsidy_amount ?? current.subsidy_amount) || 0;

    const subtotalBeforeGst = Math.max(0, (numBasePrice + numStructureCost) - numDiscount);
    const gstAmount = Math.round((subtotalBeforeGst * numGstRate) / 100);
    const totalAmount = Math.round(subtotalBeforeGst + gstAmount);
    const netPayableAmount = Math.max(0, totalAmount - numSubsidy);

    const status = req.body.status ?? current.status;
    const valid_until = req.body.valid_until ?? current.valid_until;
    const terms_and_conditions = req.body.terms_and_conditions ?? current.terms_and_conditions;
    const notes = req.body.notes ?? current.notes;

    const sql = `
      UPDATE quotations SET
        customer_name = ?, customer_email = ?, customer_phone = ?, customer_address = ?,
        city = ?, state = ?, pincode = ?, system_capacity_kw = ?, system_type = ?,
        panel_brand = ?, panel_type = ?, panel_count = ?, inverter_brand = ?,
        inverter_capacity_kw = ?, structure_type = ?, base_price = ?,
        structure_installation_cost = ?, gst_rate = ?, gst_amount = ?,
        discount_amount = ?, total_amount = ?, subsidy_amount = ?,
        net_payable_amount = ?, status = ?, valid_until = ?,
        terms_and_conditions = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      customer_name, customer_email, customer_phone, customer_address,
      city, state, pincode, system_capacity_kw, system_type,
      panel_brand, panel_type, panel_count, inverter_brand,
      inverter_capacity_kw, structure_type, numBasePrice,
      numStructureCost, numGstRate, gstAmount,
      numDiscount, totalAmount, numSubsidy,
      netPayableAmount, status, valid_until,
      terms_and_conditions, notes, id
    ];

    await db.query(sql, values);

    return res.json({
      success: true,
      message: "Quotation updated successfully",
      data: { id: Number(id), net_payable_amount: netPayableAmount },
    });
  } catch (err) {
    console.error("updateQuotation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update quotation",
      error: err.message,
    });
  }
};

// ============================================================
// 7. DELETE QUOTATION (CRM Admin/Manager)
// DELETE /api/quotations/:id
// ============================================================
const deleteQuotation = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    const [existing] = await db.query(`SELECT * FROM quotations WHERE id = ? LIMIT 1`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    await db.query(`DELETE FROM quotations WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: "Quotation deleted successfully",
    });
  } catch (err) {
    console.error("deleteQuotation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete quotation",
      error: err.message,
    });
  }
};

// ============================================================
// 7.1 BULK DELETE QUOTATIONS (CRM Admin/Manager)
// POST /api/quotations/bulk-delete
// ============================================================
const bulkDeleteQuotations = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of quotation IDs to delete." });
    }

    const [result] = await db.query(`DELETE FROM quotations WHERE id IN (?)`, [ids]);

    return res.json({
      success: true,
      message: `${result.affectedRows || ids.length} quotations deleted successfully.`,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("bulkDeleteQuotations error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk delete quotations",
      error: err.message,
    });
  }
};

// ============================================================
// 8. DUPLICATE / CLONE QUOTATION
// POST /api/quotations/:id/duplicate
// ============================================================
const duplicateQuotation = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;
    const userId = req.user?.id || null;

    const [existing] = await db.query(`SELECT * FROM quotations WHERE id = ? LIMIT 1`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    const current = existing[0];
    const newQuotationNumber = await generateQuotationNumber(db);
    const newPublicToken = crypto.randomBytes(24).toString("hex");

    const sql = `
      INSERT INTO quotations (
        quotation_number, public_token, lead_id, calculation_id,
        customer_name, customer_email, customer_phone, customer_address, city, state, pincode,
        system_capacity_kw, system_type, panel_brand, panel_type, panel_count,
        inverter_brand, inverter_capacity_kw, structure_type, battery_capacity_ah,
        base_price, structure_installation_cost, gst_rate, gst_amount, discount_amount,
        total_amount, subsidy_amount, net_payable_amount,
        annual_generation_kwh, annual_savings, payback_years, twenty_five_year_savings,
        status, valid_until, terms_and_conditions, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?)
    `;

    const values = [
      newQuotationNumber,
      newPublicToken,
      current.lead_id,
      current.calculation_id,
      `${current.customer_name} (Copy)`,
      current.customer_email,
      current.customer_phone,
      current.customer_address,
      current.city,
      current.state,
      current.pincode,
      current.system_capacity_kw,
      current.system_type,
      current.panel_brand,
      current.panel_type,
      current.panel_count,
      current.inverter_brand,
      current.inverter_capacity_kw,
      current.structure_type,
      current.battery_capacity_ah,
      current.base_price,
      current.structure_installation_cost,
      current.gst_rate,
      current.gst_amount,
      current.discount_amount,
      current.total_amount,
      current.subsidy_amount,
      current.net_payable_amount,
      current.annual_generation_kwh,
      current.annual_savings,
      current.payback_years,
      current.twenty_five_year_savings,
      current.valid_until,
      current.terms_and_conditions,
      current.notes,
      userId || current.created_by,
    ];

    const [result] = await db.query(sql, values);

    return res.status(201).json({
      success: true,
      message: "Quotation duplicated successfully",
      data: {
        id: result.insertId,
        quotation_number: newQuotationNumber,
        public_token: newPublicToken,
      },
    });
  } catch (err) {
    console.error("duplicateQuotation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to duplicate quotation",
      error: err.message,
    });
  }
};

// ============================================================
// 9. UPDATE QUOTATION STATUS (Quick status change)
// PATCH /api/quotations/:id/status
// ============================================================
const updateQuotationStatus = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;
    const { status } = req.body;

    if (!["Draft", "Sent", "Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const [existing] = await db.query(`SELECT * FROM quotations WHERE id = ? LIMIT 1`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    await db.query(`UPDATE quotations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);

    return res.json({
      success: true,
      message: `Quotation status updated to ${status}`,
    });
  } catch (err) {
    console.error("updateQuotationStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: err.message,
    });
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  getPublicQuotation,
  acceptPublicQuotation,
  updateQuotation,
  deleteQuotation,
  bulkDeleteQuotations,
  duplicateQuotation,
  updateQuotationStatus,
};
