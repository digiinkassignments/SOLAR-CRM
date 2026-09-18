// ============================================================
// SUBSCRIPTION ROUTES — CLIENT SIDE
// Client ke locked page se yahi routes call honge
// /api/subscription/...
// ============================================================

const express  = require("express");
const router   = express.Router();
const { masterDb } = require("../config/masterDb");
const { verifyToken } = require("../middleware/authMiddleware");

// ============================================================
// GET /api/subscription/status
// Client ka current subscription status + plan features
// Frontend banner, lock check sab yahan se
// ============================================================
router.get("/status", async (req, res) => {
  try {
    const client = req.clientInfo;
    if (!client) {
      return res.status(400).json({ success: false, message: "Client info not found." });
    }

    const [planRows] = await masterDb.query(
      `SELECT * FROM plans WHERE id = ? LIMIT 1`, [client.plan_id]
    );

    // Master settings (payment details for locked page)
    const [settings] = await masterDb.query(
      `SELECT bank_account_name, bank_account_number, bank_ifsc, bank_name,
              upi_id, upi_qr_image, support_phone, support_email, support_whatsapp,
              company_name
       FROM master_settings LIMIT 1`
    );

    return res.status(200).json({
      success: true,
      data: {
        status:             client.status,
        subscription_end:   client.subscription_end,
        grace_end_date:     client.grace_end_date,
        delete_date:        client.delete_date,
        plan:               planRows[0] || null,
        payment_details:    settings[0] || null,
        warning:            req.subscriptionWarning || null,
      },
    });
  } catch (err) {
    console.error("subscription/status error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
});

// ============================================================
// POST /api/subscription/payment-request
// Client ne "I have made the payment" button dabaya
// Super Admin dashboard par flag aata hai
// ============================================================
router.post("/payment-request", async (req, res) => {
  try {
    const client = req.clientInfo;
    if (!client) {
      return res.status(400).json({ success: false, message: "Client info not found." });
    }

    const { utr_number, payment_note, plan_id } = req.body;

    // Already pending request hai to duplication avoid karo
    const [existing] = await masterDb.query(
      `SELECT id FROM payment_requests
       WHERE client_id = ? AND status = 'Pending' LIMIT 1`,
      [client.id]
    );

    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        already_submitted: true,
        message: "Your payment request is already submitted. Our team will verify and activate your account shortly.",
      });
    }

    // Plan amount fetch karo
    const finalPlanId = plan_id || client.plan_id;
    const [planRows] = await masterDb.query(
      `SELECT price_monthly FROM plans WHERE id = ? LIMIT 1`, [finalPlanId]
    );
    const amount = planRows[0]?.price_monthly || 0;

    await masterDb.query(
      `INSERT INTO payment_requests (client_id, plan_id, amount, utr_number, payment_note)
       VALUES (?, ?, ?, ?, ?)`,
      [client.id, finalPlanId, amount, utr_number || null, payment_note || null]
    );

    return res.status(201).json({
      success: true,
      message: "Payment request submitted successfully. Our team will verify and activate your account within a few hours.",
    });

  } catch (err) {
    console.error("payment-request error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
});

// ============================================================
// GET /api/subscription/payment-status
// Client check kare ki uska payment request confirm hua ya nahi
// ============================================================
router.get("/payment-status", async (req, res) => {
  try {
    const client = req.clientInfo;
    if (!client) {
      return res.status(400).json({ success: false, message: "Client info not found." });
    }

    const [rows] = await masterDb.query(
      `SELECT status, requested_at, actioned_at, rejection_note
       FROM payment_requests
       WHERE client_id = ?
       ORDER BY requested_at DESC LIMIT 1`,
      [client.id]
    );

    return res.status(200).json({
      success: true,
      data: rows[0] || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
});

module.exports = router;
