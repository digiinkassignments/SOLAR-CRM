// ============================================================
// SUPER ADMIN CONTROLLER
// Clients, Plans, Payments, Settings manage karna
// ============================================================

const bcrypt   = require("bcrypt");
const jwt      = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { masterDb }            = require("../config/masterDb");
const { getClientPool }       = require("../config/clientDb");
const { provisionNewClient }  = require("../services/clientProvisionService");
const { sendSubscriptionEmail } = require("../services/subscriptionEmailService");
const { generateInvoicePDFBuffer } = require("./pdfController");

// ============================================================
// AUTH — Super Admin Login
// POST /superadmin/auth/login
// ============================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const [rows] = await masterDb.query(
      `SELECT * FROM super_admins WHERE email = ? LIMIT 1`, [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    await masterDb.query(
      `UPDATE super_admins SET last_login = NOW() WHERE id = ?`, [admin.id]
    );

    const token = jwt.sign(
      { id: admin.id, role: "super_admin" },
      process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    delete admin.password;
    return res.status(200).json({ success: true, token, admin });

  } catch (err) {
    console.error("SA login error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// DASHBOARD STATS
// GET /superadmin/dashboard
// ============================================================
const getDashboard = async (req, res) => {
  try {
    // Status summary
    const [statusSummary] = await masterDb.query(
      `SELECT status, COUNT(*) AS total FROM clients GROUP BY status`
    );

    // Total clients count
    const [totalClientsRows] = await masterDb.query(
      `SELECT COUNT(*) AS total FROM clients WHERE status != 'Deleted'`
    );

    // Expiring soon (7 days)
    const [expiringSoon] = await masterDb.query(
      `SELECT c.id, c.client_code, c.business_name, c.owner_name,
              c.subdomain, c.subscription_end, p.name AS plan_name,
              DATEDIFF(c.subscription_end, CURDATE()) AS days_left
       FROM clients c JOIN plans p ON c.plan_id = p.id
       WHERE c.status NOT IN ('Deleted','Locked')
         AND DATEDIFF(c.subscription_end, CURDATE()) BETWEEN 0 AND 7
       ORDER BY c.subscription_end ASC LIMIT 10`
    );

    // Pending payments count
    const [pendingPay] = await masterDb.query(
      `SELECT COUNT(*) AS total FROM payment_requests WHERE status = 'Pending'`
    );

    // Total revenue this month
    const [revenue] = await masterDb.query(
      `SELECT COALESCE(SUM(amount_paid), 0) AS total
       FROM subscription_history
       WHERE MONTH(created_at) = MONTH(CURDATE())
         AND YEAR(created_at)  = YEAR(CURDATE())`
    );

    // Monthly revenue trend (last 6 months)
    const [monthlyTrend] = await masterDb.query(
      `SELECT 
         DATE_FORMAT(created_at, '%b %Y') AS month_label,
         DATE_FORMAT(created_at, '%Y-%m') AS month_key,
         COALESCE(SUM(amount_paid), 0) AS revenue,
         COUNT(*) AS renewals
       FROM subscription_history
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month_key, month_label
       ORDER BY month_key ASC`
    );

    // Plan distribution
    const [planDistribution] = await masterDb.query(
      `SELECT p.name AS plan_name, COUNT(c.id) AS total
       FROM plans p
       LEFT JOIN clients c ON p.id = c.plan_id AND c.status != 'Deleted'
       GROUP BY p.id, p.name
       ORDER BY p.price_monthly ASC`
    );

    return res.status(200).json({
      success: true,
      data: {
        total_clients:      totalClientsRows[0]?.total || 0,
        status_summary:     statusSummary,
        expiring_soon:      expiringSoon,
        pending_payments:   pendingPay[0]?.total || 0,
        revenue_this_month: revenue[0]?.total || 0,
        monthly_trend:      monthlyTrend,
        plan_distribution:  planDistribution,
      },
    });
  } catch (err) {
    console.error("getDashboard error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// CLIENTS — Get All
// GET /superadmin/clients
// ============================================================
const getAllClients = async (req, res) => {
  try {
    const { status, plan_id, search } = req.query;
    let where = "WHERE 1=1";
    const params = [];

    if (status) {
      where += " AND c.status = ?";
      params.push(status);
    } else {
      where += " AND c.status != 'Deleted'";
    }
    if (plan_id) { where += " AND c.plan_id = ?";       params.push(plan_id); }
    if (search)  {
      where += " AND (c.business_name LIKE ? OR c.client_code LIKE ? OR c.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [clients] = await masterDb.query(
      `SELECT c.*, p.name AS plan_name, p.price_monthly
       FROM clients c JOIN plans p ON c.plan_id = p.id
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );

    return res.status(200).json({ success: true, data: clients });
  } catch (err) {
    console.error("getAllClients error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// CLIENTS — Get Single
// GET /superadmin/clients/:id
// ============================================================
const getClientById = async (req, res) => {
  try {
    const [rows] = await masterDb.query(
      `SELECT c.*, p.name AS plan_name, p.price_monthly
       FROM clients c JOIN plans p ON c.plan_id = p.id
       WHERE c.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    // Subscription history
    const [history] = await masterDb.query(
      `SELECT sh.*, p.name AS plan_name
       FROM subscription_history sh JOIN plans p ON sh.plan_id = p.id
       WHERE sh.client_id = ? ORDER BY sh.created_at DESC`,
      [req.params.id]
    );

    // Payment requests
    const [payments] = await masterDb.query(
      `SELECT * FROM payment_requests WHERE client_id = ? ORDER BY requested_at DESC`,
      [req.params.id]
    );

    return res.status(200).json({
      success: true,
      data: { client: rows[0], history, payments },
    });
  } catch (err) {
    console.error("getClientById error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// CLIENTS — Create New Client
// POST /superadmin/clients
// ============================================================
const createClient = async (req, res) => {
  try {
    const {
      business_name, owner_name, email, phone,
      city, state, subdomain, plan_id, duration_months,
    } = req.body;

    if (!business_name || !owner_name || !email || !phone || !subdomain || !plan_id) {
      return res.status(400).json({ success: false, message: "All required fields must be filled." });
    }

    // Subdomain already exists check
    const [existing] = await masterDb.query(
      `SELECT id FROM clients WHERE subdomain = ? OR email = ?`, [subdomain, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Subdomain or email already in use." });
    }

    const result = await provisionNewClient({
      businessName:   business_name,
      ownerName:      owner_name,
      email, phone, city, state, subdomain,
      planId:         plan_id,
      durationMonths: duration_months || 1,
      createdBy:      req.superAdmin.id,
    });

    return res.status(201).json({
      success: true,
      message: `Client created successfully. Welcome email sent to ${email}.`,
      data:    result,
    });

  } catch (err) {
    console.error("createClient error:", err.message);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error." });
  }
};

// ============================================================
// CLIENTS — Renew / Change Plan (Manual Activation)
// POST /superadmin/clients/:id/renew
// ============================================================
const renewClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const { plan_id, duration_months = 1, amount_paid, notes } = req.body;

    const [clientRows] = await masterDb.query(
      `SELECT * FROM clients WHERE id = ? LIMIT 1`, [clientId]
    );
    if (clientRows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }
    const client = clientRows[0];

    // New subscription dates
    const start    = new Date();
    const end      = new Date();
    if (duration_months < 1) {
      const days = Math.round(duration_months * 30);
      end.setDate(end.getDate() + days);
    } else {
      end.setMonth(end.getMonth() + duration_months);
    }
    const graceEnd  = new Date(end); graceEnd.setDate(graceEnd.getDate());
    const deleteDate = new Date(end); deleteDate.setDate(deleteDate.getDate() + 20);
    const toStr = (d) => d.toISOString().split("T")[0];

    const finalPlanId = plan_id || client.plan_id;

    await masterDb.query(
      `UPDATE clients SET
         plan_id = ?, status = 'Active',
         subscription_start = ?, subscription_end = ?,
         grace_end_date = ?, lock_date = ?, delete_date = ?
       WHERE id = ?`,
      [finalPlanId, toStr(start), toStr(end), toStr(graceEnd), toStr(graceEnd), toStr(deleteDate), clientId]
    );

    await masterDb.query(
      `INSERT INTO subscription_history
         (client_id, plan_id, amount_paid, start_date, end_date, renewed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, finalPlanId, amount_paid || 0, toStr(start), toStr(end), req.superAdmin.id, notes]
    );

    // Pending payment confirm
    await masterDb.query(
      `UPDATE payment_requests
       SET status = 'Confirmed', actioned_by = ?, actioned_at = NOW()
       WHERE client_id = ? AND status = 'Pending'`,
      [req.superAdmin.id, clientId]
    );

    // Payment confirmed email (with Invoice PDF attachment if a Won lead exists)
    const [planInfo] = await masterDb.query(`SELECT name FROM plans WHERE id = ? LIMIT 1`, [finalPlanId]);
    try {
      const clientPool = getClientPool(client.db_name);
      const [wonLeads] = await clientPool.query(
        `SELECT l.*, u.full_name as sales_name, u.phone as sales_phone
         FROM leads l
         LEFT JOIN users u ON l.assigned_to = u.id
         WHERE l.status = 'Won'
         ORDER BY l.updated_at DESC LIMIT 1`
      );

      const [settingsRows] = await clientPool.query(
        `SELECT * FROM settings LIMIT 1`
      );
      const clientSettings = settingsRows[0] || {};

      if (wonLeads.length > 0) {
        const lead = wonLeads[0];
        const invoiceBuffer = await generateInvoicePDFBuffer(
          lead,
          clientSettings,
          { full_name: lead.sales_name, phone: lead.sales_phone }
        );

        const transporter = nodemailer.createTransport({
          host:   process.env.MAIL_HOST,
          port:   process.env.MAIL_PORT,
          secure: false,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.MAIL_FROM,
          to:   client.email,
          subject: `Payment Confirmed — Invoice ${lead.lead_code || ""}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #388e3c; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0;">✅ Payment Confirmed!</h1>
              </div>
              <div style="padding: 24px; background: #f9f9f9;">
                <p>Dear <strong>${client.owner_name}</strong>,</p>
                <p>Your payment has been confirmed and your subscription plan <strong>${planInfo[0]?.name || ""}</strong> has been activated/renewed.</p>
                <p>Please find attached your invoice PDF for lead <strong>${lead.lead_code || ""}</strong>.</p>
                <p>Login URL: <a href="https://${client.subdomain}.digiinksolutions.com">https://${client.subdomain}.digiinksolutions.com</a></p>
              </div>
            </div>
          `,
          attachments: [
            {
              filename: `Invoice-${lead.lead_code || "client"}.pdf`,
              content: invoiceBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      } else {
        await sendSubscriptionEmail("Payment Confirmed", {
          owner_name: client.owner_name,
          email:      client.email,
          subdomain:  client.subdomain,
          plan_name:  planInfo[0]?.name,
        });
      }
    } catch (e) { console.error("Payment confirmed email failed:", e.message); }

    return res.status(200).json({ success: true, message: "Client renewed and activated successfully." });

  } catch (err) {
    console.error("renewClient error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// CLIENTS — Manual Status Change (Activate/Deactivate)
// PATCH /superadmin/clients/:id/status
// ============================================================
const updateClientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Active", "Locked"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    await masterDb.query(
      `UPDATE clients SET status = ? WHERE id = ?`,
      [status, req.params.id]
    );

    return res.status(200).json({ success: true, message: `Client status updated to ${status}.` });
  } catch (err) {
    console.error("updateClientStatus error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// PLANS — Get All
// GET /superadmin/plans
// ============================================================
const getPlans = async (req, res) => {
  try {
    const [plans] = await masterDb.query(`SELECT * FROM plans ORDER BY price_monthly ASC`);
    return res.status(200).json({ success: true, data: plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// PLANS — Update (price ya features change karo)
// PUT /superadmin/plans/:id
// ============================================================
const updatePlan = async (req, res) => {
  try {
    const {
      name, price_monthly, max_users, max_leads_per_month,
      has_manager_role, has_site_survey, has_quotation_stages,
      has_reports, has_csv_import_export, has_bulk_reassign,
      has_advanced_reports, has_activity_logs,
      has_push_notifications, has_android_apk, has_ios_app,
      has_multi_branch, has_priority_support,
    } = req.body;

    await masterDb.query(
      `UPDATE plans SET
         name = ?, price_monthly = ?, max_users = ?, max_leads_per_month = ?,
         has_manager_role = ?, has_site_survey = ?, has_quotation_stages = ?,
         has_reports = ?, has_csv_import_export = ?, has_bulk_reassign = ?,
         has_advanced_reports = ?, has_activity_logs = ?,
         has_push_notifications = ?, has_android_apk = ?, has_ios_app = ?,
         has_multi_branch = ?, has_priority_support = ?
       WHERE id = ?`,
      [
        name, price_monthly, max_users, max_leads_per_month,
        has_manager_role, has_site_survey, has_quotation_stages,
        has_reports, has_csv_import_export, has_bulk_reassign,
        has_advanced_reports, has_activity_logs,
        has_push_notifications, has_android_apk, has_ios_app,
        has_multi_branch, has_priority_support,
        req.params.id,
      ]
    );

    return res.status(200).json({ success: true, message: "Plan updated successfully." });
  } catch (err) {
    console.error("updatePlan error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// PAYMENTS — Get All Pending
// GET /superadmin/payments
// ============================================================
const getPaymentRequests = async (req, res) => {
  try {
    const { status = "Pending" } = req.query;
    const [rows] = await masterDb.query(
      `SELECT pr.*, c.client_code, c.business_name, c.owner_name,
              c.email, c.subdomain, c.status AS client_status,
              p.name AS plan_name
       FROM payment_requests pr
       JOIN clients c ON pr.client_id = c.id
       JOIN plans p   ON pr.plan_id   = p.id
       WHERE pr.status = ?
       ORDER BY pr.requested_at ASC`,
      [status]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// PAYMENTS — Confirm Payment → Auto Renew
// POST /superadmin/payments/:id/confirm
// ============================================================
const confirmPayment = async (req, res) => {
  try {
    const { duration_months = 1, notes } = req.body;

    const [prRows] = await masterDb.query(
      `SELECT * FROM payment_requests WHERE id = ? LIMIT 1`, [req.params.id]
    );
    if (prRows.length === 0) {
      return res.status(404).json({ success: false, message: "Payment request not found." });
    }

    const pr = prRows[0];

    // Payment mark confirmed
    await masterDb.query(
      `UPDATE payment_requests
       SET status = 'Confirmed', actioned_by = ?, actioned_at = NOW()
       WHERE id = ?`,
      [req.superAdmin.id, pr.id]
    );

    // Renew client (same logic as renewClient)
    req.params.id = pr.client_id;
    req.body = {
      plan_id: pr.plan_id,
      duration_months,
      amount_paid: pr.amount,
      notes,
    };
    return renewClient(req, res);

  } catch (err) {
    console.error("confirmPayment error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// PAYMENTS — Reject Payment
// POST /superadmin/payments/:id/reject
// ============================================================
const rejectPayment = async (req, res) => {
  try {
    const { rejection_note } = req.body;

    const [prRows] = await masterDb.query(
      `SELECT pr.*, c.owner_name, c.email, c.subdomain, p.name AS plan_name
       FROM payment_requests pr
       JOIN clients c ON pr.client_id = c.id
       JOIN plans p   ON pr.plan_id   = p.id
       WHERE pr.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (prRows.length === 0) {
      return res.status(404).json({ success: false, message: "Payment request not found." });
    }
    const pr = prRows[0];

    await masterDb.query(
      `UPDATE payment_requests
       SET status = 'Rejected', actioned_by = ?, actioned_at = NOW(), rejection_note = ?
       WHERE id = ?`,
      [req.superAdmin.id, rejection_note, pr.id]
    );

    try {
      await sendSubscriptionEmail("Payment Rejected", pr, { rejectionNote: rejection_note });
    } catch (e) { console.error("Rejection email failed:", e.message); }

    return res.status(200).json({ success: true, message: "Payment rejected." });
  } catch (err) {
    console.error("rejectPayment error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// MASTER SETTINGS — Get
// GET /superadmin/settings
// ============================================================
const getMasterSettings = async (req, res) => {
  try {
    const [rows] = await masterDb.query(`SELECT * FROM master_settings LIMIT 1`);
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// MASTER SETTINGS — Update (bank, UPI, support)
// PUT /superadmin/settings
// ============================================================
const updateMasterSettings = async (req, res) => {
  try {
    const {
      bank_account_name, bank_account_number, bank_ifsc, bank_name, bank_branch,
      upi_id, support_phone, support_email, support_whatsapp,
      company_name, company_website,
    } = req.body;

    await masterDb.query(
      `UPDATE master_settings SET
         bank_account_name = ?, bank_account_number = ?, bank_ifsc = ?,
         bank_name = ?, bank_branch = ?, upi_id = ?,
         support_phone = ?, support_email = ?, support_whatsapp = ?,
         company_name = ?, company_website = ?
       WHERE id = 1`,
      [
        bank_account_name, bank_account_number, bank_ifsc,
        bank_name, bank_branch, upi_id,
        support_phone, support_email, support_whatsapp,
        company_name, company_website,
      ]
    );

    return res.status(200).json({ success: true, message: "Settings updated successfully." });
  } catch (err) {
    console.error("updateMasterSettings error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// CLIENTS — Delete Client & Drop Database
// DELETE /superadmin/clients/:id
// ============================================================
const deleteClient = async (req, res) => {
  try {
    const clientId = req.params.id;

    // Client fetch karo
    const [rows] = await masterDb.query(
      `SELECT * FROM clients WHERE id = ? LIMIT 1`, [clientId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }
    const client = rows[0];

    // DB drop karo
    if (client.db_name) {
      await masterDb.query(`DROP DATABASE IF EXISTS \`${client.db_name}\``);
    }

    // Master DB mein status = Deleted
    await masterDb.query(
      `UPDATE clients SET status = 'Deleted' WHERE id = ?`, [clientId]
    );

    return res.status(200).json({
      success: true,
      message: `Client ${client.client_code} deleted successfully.`,
    });

  } catch (err) {
    console.error("deleteClient error:", err.message);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error." });
  }
};

module.exports = {
  login,
  getDashboard,
  getAllClients, getClientById, createClient,
  renewClient, updateClientStatus, deleteClient,
  getPlans, updatePlan,
  getPaymentRequests, confirmPayment, rejectPayment,
  getMasterSettings, updateMasterSettings,
};
