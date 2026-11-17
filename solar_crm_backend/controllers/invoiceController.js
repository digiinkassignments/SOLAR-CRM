const invoiceModel = require("../models/invoiceModel");
const { db: defaultDb } = require("../config/db");

// 1. Create Invoice (Convert from Quotation or Standalone)
const createInvoice = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const userId = req.user?.id || null;

    const {
      customer_name,
      customer_phone,
      system_capacity_kw,
    } = req.body;

    if (!customer_name || !customer_phone) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone number are required.",
      });
    }

    if (req.body.quotation_id) {
      await require("../services/quotationGovernance").ensure(db);
      const [quotes] = await db.query("SELECT discount_approval,revision_number FROM quotations WHERE id=?",[req.body.quotation_id]);
      if (quotes[0] && req.body.quotation_revision_number && Number(req.body.quotation_revision_number)!==Number(quotes[0].revision_number)) return res.status(409).json({success:false,message:"Quotation revision changed. Refresh before converting it."});
      if (quotes[0]) req.body.notes = `${req.body.notes || ""}\nQuotation revision: R${quotes[0].revision_number || 1}`.trim();
      if (quotes[0] && ["pending", "rejected"].includes(quotes[0].discount_approval)) return res.status(409).json({success:false,message:"Approve this quotation's discount before generating an invoice."});
    }
    const created = await invoiceModel.createInvoice(req.body, userId, db);

    return res.status(201).json({
      success: true,
      message: "Tax Invoice generated successfully.",
      data: created,
    });
  } catch (error) {
    console.error("createInvoice error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice.",
      error: error.message,
    });
  }
};

// 2. Get All Invoices
const getInvoices = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const filters = {
      search: req.query.search,
      payment_status: req.query.payment_status,
      lead_id: req.query.lead_id,
      quotation_id: req.query.quotation_id,
      role_id: req.user?.role_id,
      user_id: req.user?.id,
    };

    const rows = await invoiceModel.getInvoices(filters, db);
    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("getInvoices error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices.",
      error: error.message,
    });
  }
};

// 3. Get Single Invoice Details (CRM View with Company Settings)
const getInvoiceById = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    const invoice = await invoiceModel.getInvoiceById(id, db);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    // Safely load company settings for print / tax details
    let companySettings = {
      company_name: "Solar CRM Partner",
      company_email: "support@solarcrm.com",
      company_phone: "+91 98765 43210",
      company_address: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      website: "",
      company_logo: null,
      logo_url: null,
      gst_number: "",
      pan_number: "",
      bank_name: "",
      account_name: "",
      account_number: "",
      ifsc_code: "",
      branch_name: "",
      upi_id: "",
    };

    try {
      const [settingRows] = await db.query(`SELECT * FROM settings LIMIT 1`);
      if (settingRows.length > 0) {
        const s = settingRows[0];
        companySettings = {
          ...companySettings,
          ...s,
          company_name: s.company_name || s.name || companySettings.company_name,
          company_email: s.company_email || s.email || companySettings.company_email,
          company_phone: s.company_phone || s.phone || companySettings.company_phone,
          company_address: s.address || s.company_address || "",
          address: s.address || s.company_address || "",
          city: s.city || "",
          state: s.state || "",
          country: s.country || "India",
          pincode: s.pincode || "",
          website: s.website || "",
          company_logo: s.company_logo || s.logo_url || s.logo || null,
          logo_url: s.company_logo || s.logo_url || s.logo || null,
          gst_number: s.gst_number || s.gstin || "",
          pan_number: s.pan_number || s.pan || "",
          bank_name: s.bank_name || "",
          account_name: s.account_name || s.company_name || "",
          account_number: s.account_number || "",
          ifsc_code: s.ifsc_code || "",
          branch_name: s.branch_name || "",
          upi_id: s.upi_id || "",
        };
      }
    } catch (e) {
      console.warn("Could not load settings:", e.message);
    }

    return res.json({
      success: true,
      data: {
        ...invoice,
        company: companySettings,
      },
    });
  } catch (error) {
    console.error("getInvoiceById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice details.",
      error: error.message,
    });
  }
};

// 4. Get Public Invoice (Customer Web View / PDF download)
const getPublicInvoice = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { token } = req.params;

    const invoice = await invoiceModel.getInvoiceByToken(token, db);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or link has expired.",
      });
    }

    // Safely load company settings
    let companySettings = {
      company_name: "Solar CRM Partner",
      company_email: "support@solarcrm.com",
      company_phone: "+91 98765 43210",
      company_address: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      website: "",
      company_logo: null,
      logo_url: null,
      gst_number: "",
      pan_number: "",
      bank_name: "",
      account_name: "",
      account_number: "",
      ifsc_code: "",
      branch_name: "",
      upi_id: "",
    };

    try {
      const [settingRows] = await db.query(`SELECT * FROM settings LIMIT 1`);
      if (settingRows.length > 0) {
        const s = settingRows[0];
        companySettings = {
          ...companySettings,
          ...s,
          company_name: s.company_name || s.name || companySettings.company_name,
          company_email: s.company_email || s.email || companySettings.company_email,
          company_phone: s.company_phone || s.phone || companySettings.company_phone,
          company_address: s.address || s.company_address || "",
          address: s.address || s.company_address || "",
          city: s.city || "",
          state: s.state || "",
          country: s.country || "India",
          pincode: s.pincode || "",
          website: s.website || "",
          company_logo: s.company_logo || s.logo_url || s.logo || null,
          logo_url: s.company_logo || s.logo_url || s.logo || null,
          gst_number: s.gst_number || s.gstin || "",
          pan_number: s.pan_number || s.pan || "",
          bank_name: s.bank_name || "",
          account_name: s.account_name || s.company_name || "",
          account_number: s.account_number || "",
          ifsc_code: s.ifsc_code || "",
          branch_name: s.branch_name || "",
          upi_id: s.upi_id || "",
        };
      }
    } catch (e) {
      console.warn("Could not load settings:", e.message);
    }

    return res.json({
      success: true,
      data: {
        ...invoice,
        company: companySettings,
      },
    });
  } catch (error) {
    console.error("getPublicInvoice error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch public invoice.",
      error: error.message,
    });
  }
};

// 5. Record Payment Installment
const recordPayment = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const userId = req.user?.id || null;
    const { id } = req.params;

    const result = await invoiceModel.recordPayment(id, req.body, userId, db);

    return res.json({
      success: true,
      message: "Payment recorded successfully.",
      data: result,
    });
  } catch (error) {
    console.error("recordPayment error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to record payment.",
    });
  }
};

// 6. Delete Invoice
const deleteInvoice = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    await db.query(`DELETE FROM invoices WHERE id = ?`, [id]);
    return res.json({
      success: true,
      message: "Invoice deleted successfully.",
    });
  } catch (error) {
    console.error("deleteInvoice error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete invoice.",
      error: error.message,
    });
  }
};

// 6.1 Bulk Delete Invoices
const bulkDeleteInvoices = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of invoice IDs to delete." });
    }

    // Delete any dependent child payments first
    try {
      await db.query(`DELETE FROM invoice_payments WHERE invoice_id IN (?)`, [ids]);
    } catch (pErr) {
      console.warn("Could not delete child invoice_payments:", pErr.message);
    }

    const [result] = await db.query(`DELETE FROM invoices WHERE id IN (?)`, [ids]);

    return res.json({
      success: true,
      message: `${result.affectedRows || ids.length} invoices deleted successfully.`,
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("bulkDeleteInvoices error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk delete invoices.",
      error: error.message,
    });
  }
};

const sendInvoiceEmail = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    let scope = "";
    const params = [req.params.id];
    if (Number(req.user.role_id) === 3) {
      scope = " AND (inv.created_by = ? OR l.assigned_to = ?)";
      params.push(req.user.id, req.user.id);
    } else if (Number(req.user.role_id) === 2) {
      scope = " AND (inv.created_by = ? OR inv.created_by IN (SELECT id FROM users WHERE manager_id = ?) OR l.assigned_to = ? OR l.assigned_to IN (SELECT id FROM users WHERE manager_id = ?))";
      params.push(req.user.id, req.user.id, req.user.id, req.user.id);
    }
    const [rows] = await db.query(`SELECT inv.* FROM invoices inv LEFT JOIN leads l ON inv.lead_id = l.id WHERE inv.id = ?${scope} LIMIT 1`, params);
    const invoice = rows[0];
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found or access denied." });
    const recipient = String(req.body?.to || invoice.customer_email || "").trim();
    if (recipient.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return res.status(400).json({ success: false, message: "Save a valid customer email address first." });
    if (!invoice.public_token) return res.status(409).json({ success: false, message: "Invoice share link is unavailable." });
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) return res.status(503).json({ success: false, message: "Email is not configured. Contact your administrator." });
    const host = String(req.get("host") || "").toLowerCase();
    if (!/^[a-z0-9.-]+(?::\d{1,5})?$/.test(host)) return res.status(400).json({ success: false, message: "Invalid invoice link host." });
    const url = `https://${host}/invoice/${encodeURIComponent(invoice.public_token)}`;
    const port = Number(process.env.MAIL_PORT || 587);
    const transport = require("nodemailer").createTransport({ host: process.env.MAIL_HOST, port, secure: port === 465, auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }, connectionTimeout: 15000, socketTimeout: 30000 });
    await transport.sendMail({
      from: process.env.MAIL_FROM || { name: req.clientInfo?.business_name || "Solar CRM", address: process.env.MAIL_USER },
      to: recipient, replyTo: process.env.MAIL_USER,
      subject: `Tax invoice ${invoice.invoice_number}`,
      text: `Dear ${invoice.customer_name || "Customer"},\n\nYour tax invoice ${invoice.invoice_number} is ready.\n\nView your invoice and download its PDF:\n${url}\n\nRegards,\n${req.clientInfo?.business_name || "Solar CRM"}`,
    });
    return res.json({ success: true, message: `Invoice sent to ${recipient}.` });
  } catch (error) {
    console.error("sendInvoiceEmail error:", error.code || "EMAIL_FAILED");
    return res.status(502).json({ success: false, message: "Email could not be sent. Check mail settings and try again." });
  }
};

module.exports = {
  sendInvoiceEmail,
  createInvoice,
  getInvoices,
  getInvoiceById,
  getPublicInvoice,
  recordPayment,
  deleteInvoice,
  bulkDeleteInvoices,
};
