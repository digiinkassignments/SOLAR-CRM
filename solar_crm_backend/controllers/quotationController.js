const quotationGovernance = require("../services/quotationGovernance");
const { solarTax } = require("../utils/solarTax");
const ensureTaxColumns = require("../utils/ensureTaxColumns");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { db: defaultDb } = require("../config/db");

const ensuredQuotationItemDbs = new WeakSet();
const ensureQuotationItemsColumn = async (db) => {
  if (ensuredQuotationItemDbs.has(db)) return;
  const [columns] = await db.query("SHOW COLUMNS FROM quotations LIKE 'line_items_json'");
  if (!columns.length) {
    await db.query("ALTER TABLE quotations ADD COLUMN line_items_json LONGTEXT NULL AFTER notes");
  }
  ensuredQuotationItemDbs.add(db);
};

const buildQuotationItems = (rawItems, discountAmount = 0) => {
  if (!Array.isArray(rawItems)) return null;
  const items = rawItems.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price);
    const gstRate = Number(item.gst_rate);
    if (!item.name || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
      throw new Error("Quotation items need a name, positive quantity, non-negative price, and valid GST rate.");
    }
    return {
      stock_item_id: item.stock_item_id ? Number(item.stock_item_id) : null,
      item_code: item.item_code || null,
      name: String(item.name).trim().slice(0, 200),
      description: item.description ? String(item.description).trim().slice(0, 500) : null,
      hsn_code: item.hsn_code ? String(item.hsn_code).trim().slice(0, 20) : null,
      unit: item.unit ? String(item.unit).trim().slice(0, 50) : "Piece",
      quantity,
      unit_price: unitPrice,
      gst_rate: gstRate,
      taxable_amount: Math.round(quantity * unitPrice * 100) / 100,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.taxable_amount, 0);
  const discount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  let discountAllocated = 0;
  const normalized = items.map((item, index) => {
    const allocated = index === items.length - 1
      ? Math.round((discount - discountAllocated) * 100) / 100
      : Math.round((subtotal ? discount * item.taxable_amount / subtotal : 0) * 100) / 100;
    discountAllocated += allocated;
    const taxableAfterDiscount = Math.max(0, Math.round((item.taxable_amount - allocated) * 100) / 100);
    const gstAmount = Math.round(taxableAfterDiscount * item.gst_rate) / 100;
    return { ...item, discount_amount: allocated, taxable_after_discount: taxableAfterDiscount, gst_amount: gstAmount, total_amount: Math.round((taxableAfterDiscount + gstAmount) * 100) / 100 };
  });
  return { items: normalized, subtotal, discount, taxableTotal: Math.max(0, subtotal - discount), gstTotal: normalized.reduce((sum, item) => sum + item.gst_amount, 0), total: normalized.reduce((sum, item) => sum + item.total_amount, 0) };
};

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
    if (req.body.gst_mode && !["solar_composite", "itemised"].includes(req.body.gst_mode)) return res.status(400).json({ success: false, message: "Invalid GST mode" });
    const db = req.db || defaultDb;
    await ensureTaxColumns(db, "quotations");
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
      line_items = null,
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
    const numGstRate = Number(gst_rate ?? 13.80);
    const numSubsidy = parseFloat(subsidy_amount) || 0;

    let quotationItems = null;
    if (Array.isArray(line_items) && line_items.length) {
      quotationItems = buildQuotationItems(line_items, numDiscount);
      if (req.body.gst_mode === "solar_composite") quotationItems.items = quotationItems.items.map(item => ({ ...item, gst_amount: 0, total_amount: item.taxable_after_discount }));
    }
    const subtotalBeforeGst = quotationItems ? quotationItems.taxableTotal : Math.max(0, (numBasePrice + numStructureCost) - numDiscount);
    const gstMode = req.body.gst_mode || "itemised";
    const tax = solarTax({ mode: gstMode, subtotal: subtotalBeforeGst, rate: numGstRate });
    const gstAmount = gstMode === "solar_composite" ? tax.gst : quotationItems ? quotationItems.gstTotal : tax.gst;
    const totalAmount = Math.round((subtotalBeforeGst + gstAmount) * 100) / 100;
    const effectiveGstRate = gstMode === "solar_composite" ? 8.9 : quotationItems && subtotalBeforeGst > 0 ? Number((gstAmount / subtotalBeforeGst * 100).toFixed(2)) : numGstRate;
    const persistedBasePrice = quotationItems ? quotationItems.subtotal : numBasePrice;
    const persistedStructureCost = quotationItems ? 0 : numStructureCost;
    const persistedDiscount = quotationItems ? quotationItems.discount : numDiscount;
    const netPayableAmount = Math.max(0, totalAmount - numSubsidy);

    const calculatedPanelCount = parseInt(panel_count, 10) || Math.ceil((parseFloat(system_capacity_kw) * 1000) / 550);
    const calculatedInverterKw = parseFloat(inverter_capacity_kw) || parseFloat(system_capacity_kw);

    if (quotationItems) await ensureQuotationItemsColumn(db);
    const sql = `
      INSERT INTO quotations (
        quotation_number, public_token, lead_id, calculation_id,
        customer_name, customer_email, customer_phone, customer_address, city, state, pincode,
        system_capacity_kw, system_type, panel_brand, panel_type, panel_count,
        inverter_brand, inverter_capacity_kw, structure_type, battery_capacity_ah,
        base_price, structure_installation_cost, gst_rate, gst_amount, discount_amount,
        total_amount, subsidy_amount, net_payable_amount,
        annual_generation_kwh, annual_savings, payback_years, twenty_five_year_savings,
        status, valid_until, terms_and_conditions, notes, created_by, gst_mode, gst_summary_json${quotationItems ? ", line_items_json" : ""}
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Sent', ?, ?, ?, ?, ?, ?${quotationItems ? ", ?" : ""})
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
      persistedBasePrice,
      persistedStructureCost,
      effectiveGstRate,
      gstAmount,
      persistedDiscount,
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
    values.push(gstMode, JSON.stringify({ ...tax, gst: gstAmount, total: totalAmount }));
    if (quotationItems) values.push(JSON.stringify(quotationItems.items));

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
    await ensureTaxColumns(db, "quotations");
    const { lead_id, search, status } = req.query;

    let sql = `
      SELECT q.*, l.lead_code, u.full_name AS created_by_name
      FROM quotations q
      LEFT JOIN leads l ON q.lead_id = l.id
      LEFT JOIN users u ON q.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    const roleId = Number(req.user?.role_id);
    const userId = req.user?.id;

    // Role-based scoping: Sales sees own quotations, Manager sees team's quotations, Admin sees all
    if (roleId === 3) { // Sales
      sql += ` AND (q.created_by = ? OR l.assigned_to = ?)`;
      params.push(userId, userId);
    } else if (roleId === 2) { // Manager
      sql += ` AND l.is_deleted=0 AND l.assigned_to IN (SELECT id FROM users WHERE manager_id=? AND role_id=3 AND is_deleted=0)`;
      params.push(userId);
    }

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
    await ensureTaxColumns(db, "quotations");
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
    await ensureTaxColumns(db, "quotations");
    const { token } = req.params;

    // Support lookup by public_token OR numeric id OR quotation_number
    await quotationGovernance.ensure(db);
    let [rows] = await db.query(
      `SELECT * FROM quotations WHERE public_token = ? OR id = ? OR quotation_number = ? LIMIT 1`,
      [token, isNaN(token) ? 0 : parseInt(token, 10), token]
    );

    if (!rows.length) {
      const [archived] = await db.query("SELECT snapshot_json FROM quotation_revisions WHERE public_token=? LIMIT 1", [token]);
      if (archived[0]) rows = [{ ...JSON.parse(archived[0].snapshot_json), is_superseded: true }];
    }
    if (rows[0] && ["pending", "rejected"].includes(rows[0].discount_approval)) return res.status(409).json({success:false,message:"This quotation requires discount approval before it can be shared."});
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found or link has expired.",
      });
    }

    const quotation = rows[0];

    // Safely mark as viewed
    try {
      if (!quotation.is_superseded && !quotation.viewed_at) {
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
    await ensureTaxColumns(db, "quotations");
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
    await ensureTaxColumns(db, "quotations");
    const { id } = req.params;

    const [existingRows] = await db.query(`SELECT * FROM quotations WHERE id = ? LIMIT 1`, [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    const current = existingRows[0];

    const gstMode = req.body.gst_mode || current.gst_mode || "itemised";
    if (req.body.gst_mode && !["itemised", "solar_composite"].includes(req.body.gst_mode)) return res.status(400).json({ success: false, message: "Invalid GST mode" });
    let quotationItems = null;
    if (req.body.gst_mode && !req.body.line_items && current.line_items_json) req.body.line_items = JSON.parse(current.line_items_json);
    if (Array.isArray(req.body.line_items) && req.body.line_items.length) {
      quotationItems = buildQuotationItems(req.body.line_items, req.body.discount_amount ?? current.discount_amount);
      if (gstMode === "solar_composite") quotationItems.items = quotationItems.items.map(item => ({ ...item, gst_amount: 0, total_amount: item.taxable_after_discount }));
      await ensureQuotationItemsColumn(db);
    }
    const pricingChanged = ["base_price", "structure_installation_cost", "discount_amount", "gst_rate"].some((key) =>
      req.body[key] !== undefined && Number(req.body[key]) !== Number(current[key])
    );
    const clearStoredItems = Boolean(current.line_items_json) && !quotationItems && pricingChanged;
    const preserveStoredItems = Boolean(current.line_items_json) && !quotationItems && !pricingChanged;
    if (clearStoredItems) await ensureQuotationItemsColumn(db);

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
    const numGstRate = Number(req.body.gst_rate ?? current.gst_rate ?? 13.80);
    const numSubsidy = parseFloat(req.body.subsidy_amount ?? current.subsidy_amount) || 0;

    const subtotalBeforeGst = quotationItems ? quotationItems.taxableTotal : Math.max(0, (numBasePrice + numStructureCost) - numDiscount);
    const tax = solarTax({ mode: gstMode, subtotal: subtotalBeforeGst, rate: numGstRate });
    const gstAmount = gstMode === "solar_composite" ? tax.gst : quotationItems ? quotationItems.gstTotal : preserveStoredItems ? Number(current.gst_amount) || 0 : tax.gst;
    const totalAmount = Math.round((subtotalBeforeGst + gstAmount) * 100) / 100;
    const effectiveGstRate = gstMode === "solar_composite" ? 8.9 : quotationItems && subtotalBeforeGst > 0 ? Number((gstAmount / subtotalBeforeGst * 100).toFixed(2)) : numGstRate;
    const persistedBasePrice = quotationItems ? quotationItems.subtotal : numBasePrice;
    const persistedStructureCost = quotationItems ? 0 : numStructureCost;
    const persistedDiscount = quotationItems ? quotationItems.discount : numDiscount;
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
        terms_and_conditions = ?, notes = ?, gst_mode = ?, gst_summary_json = ?${quotationItems || clearStoredItems ? ", line_items_json = ?" : ""}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      customer_name, customer_email, customer_phone, customer_address,
      city, state, pincode, system_capacity_kw, system_type,
      panel_brand, panel_type, panel_count, inverter_brand,
      inverter_capacity_kw, structure_type, persistedBasePrice,
      persistedStructureCost, effectiveGstRate, gstAmount,
      persistedDiscount, totalAmount, numSubsidy,
      netPayableAmount, status, valid_until,
      terms_and_conditions, notes, gstMode, JSON.stringify({ ...tax, gst: gstAmount, total: totalAmount }), ...(quotationItems ? [JSON.stringify(quotationItems.items)] : clearStoredItems ? [null] : []), id
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
    await ensureTaxColumns(db, "quotations");
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
    await ensureTaxColumns(db, "quotations");
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
    await ensureTaxColumns(db, "quotations");
    const { id } = req.params;
    const userId = req.user?.id || null;

    const [existing] = await db.query(`SELECT * FROM quotations WHERE id = ? LIMIT 1`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    const current = existing[0];
    const newQuotationNumber = await generateQuotationNumber(db);
    const newPublicToken = crypto.randomBytes(24).toString("hex");
    const hasLineItems = Boolean(current.line_items_json);

    const sql = `
      INSERT INTO quotations (
        quotation_number, public_token, lead_id, calculation_id,
        customer_name, customer_email, customer_phone, customer_address, city, state, pincode,
        system_capacity_kw, system_type, panel_brand, panel_type, panel_count,
        inverter_brand, inverter_capacity_kw, structure_type, battery_capacity_ah,
        base_price, structure_installation_cost, gst_rate, gst_amount, discount_amount,
        total_amount, subsidy_amount, net_payable_amount,
        annual_generation_kwh, annual_savings, payback_years, twenty_five_year_savings,
        status, valid_until, terms_and_conditions, notes, created_by, gst_mode, gst_summary_json${hasLineItems ? ", line_items_json" : ""}
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?${hasLineItems ? ", ?" : ""})
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
    values.push(current.gst_mode || null, current.gst_summary_json || null);
    if (hasLineItems) values.push(current.line_items_json);

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
    await ensureTaxColumns(db, "quotations");
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

const escapeEmailHtml = (value = "") => String(value).replace(/[&<>\"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const sendQuotationEmail = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    await ensureTaxColumns(db, "quotations");
    const { id } = req.params;
    const requestedRecipient = String(req.body?.to || "").trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (requestedRecipient.length > 254 || !emailPattern.test(requestedRecipient)) {
      return res.status(400).json({ success: false, message: "Enter a valid recipient email address." });
    }
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
      return res.status(503).json({ success: false, message: "Quotation email is not configured. Contact your administrator." });
    }

    const [rows] = await db.query("SELECT * FROM quotations WHERE id = ? LIMIT 1", [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    const quotation = rows[0];
    const host = String(req.get("host") || "").toLowerCase();
    if (!/^[a-z0-9.-]+(?::\d{1,5})?$/.test(host)) {
      return res.status(400).json({ success: false, message: "Could not build a secure proposal link for this request." });
    }
    const publicUrl = `https://${host}/quote/${encodeURIComponent(quotation.public_token || quotation.quotation_number || quotation.id)}`;
    const customerName = escapeEmailHtml(quotation.customer_name || "Customer");
    const quotationNumber = escapeEmailHtml(quotation.quotation_number || `QUO-${quotation.id}`);
    const capacity = escapeEmailHtml(`${quotation.system_capacity_kw || 0} kW`);
    const systemType = escapeEmailHtml(quotation.system_type || "Solar");
    const companyName = escapeEmailHtml(req.clientInfo?.business_name || "Solar CRM");
    const totalAmount = Number(quotation.total_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    const subsidyAmount = Number(quotation.subsidy_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    const netAmount = Number(quotation.net_payable_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    const validUntil = quotation.valid_until
      ? new Date(quotation.valid_until).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "As stated in the proposal";
    const safeUrl = escapeEmailHtml(publicUrl);
    const port = Number(process.env.MAIL_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM || { name: `${req.clientInfo?.business_name || "Solar CRM"} via Solar CRM`, address: process.env.MAIL_USER },
      to: requestedRecipient,
      replyTo: process.env.MAIL_USER,
      subject: `Solar proposal ${quotationNumber} · ${capacity} system`,
      text: `Dear ${quotation.customer_name || "Customer"},\n\nYour ${capacity} ${quotation.system_type || "Solar"} proposal (${quotation.quotation_number || `QUO-${quotation.id}`}) is ready.\n\nQuotation total: INR ${totalAmount}\nEstimated subsidy: INR ${subsidyAmount}\nNet payable: INR ${netAmount}\nValid until: ${validUntil}\n\nView the proposal and download the PDF: ${publicUrl}\n\nRegards,\n${req.clientInfo?.business_name || "Solar CRM"}`,
      html: `
        <div style="margin:0;background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
          <div style="max-width:620px;margin:0 auto;overflow:hidden;border:1px solid #e2e8f0;border-radius:16px;background:#fff">
            <div style="padding:26px 30px;background:#0f172a;border-bottom:4px solid #d97706">
              <p style="margin:0 0 6px;color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Solar proposal</p>
              <h1 style="margin:0;color:#fff;font-size:22px">${companyName}</h1>
              <p style="margin:8px 0 0;color:#cbd5e1;font-size:13px">Quotation ${quotationNumber}</p>
            </div>
            <div style="padding:30px">
              <p style="margin:0 0 12px;font-size:16px">Dear ${customerName},</p>
              <p style="margin:0 0 22px;color:#475569;font-size:14px;line-height:1.65">Your solar proposal is ready to review. It includes the system details, commercial summary, terms and a downloadable PDF.</p>
              <div style="margin:0 0 22px;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
                <div style="margin-bottom:12px;color:#64748b;font-size:12px">${capacity} · ${systemType}</div>
                <div style="display:flex;justify-content:space-between;margin:8px 0;color:#475569;font-size:13px"><span>Quotation total</span><strong style="color:#0f172a">₹${totalAmount}</strong></div>
                <div style="display:flex;justify-content:space-between;margin:8px 0;color:#475569;font-size:13px"><span>Estimated subsidy</span><strong style="color:#15803d">− ₹${subsidyAmount}</strong></div>
                <div style="display:flex;justify-content:space-between;margin-top:14px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:15px"><strong>Net payable</strong><strong style="color:#0f172a">₹${netAmount}</strong></div>
                <p style="margin:12px 0 0;color:#64748b;font-size:12px">Valid until: ${escapeEmailHtml(validUntil)}</p>
              </div>
              <div style="text-align:center;margin:26px 0">
                <a href="${safeUrl}" style="display:inline-block;padding:13px 22px;border-radius:9px;background:#0f172a;color:#fff;text-decoration:none;font-size:14px;font-weight:700">View proposal &amp; download PDF</a>
              </div>
              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6">If the button does not open, copy this link into your browser:<br><a href="${safeUrl}" style="color:#1d4ed8;word-break:break-all">${safeUrl}</a></p>
            </div>
            <div style="padding:16px 30px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#94a3b8;font-size:11px">This proposal was shared by ${companyName}. Please contact your solar consultant if you have questions.</div>
          </div>
        </div>
      `,
    });

    return res.json({ success: true, message: `Quotation sent to ${requestedRecipient}.` });
  } catch (err) {
    console.error("sendQuotationEmail error:", err.code || err.message);
    return res.status(502).json({ success: false, message: "Email could not be sent. Check mail settings and try again." });
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
  sendQuotationEmail,
};
