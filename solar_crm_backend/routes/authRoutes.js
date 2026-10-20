const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

const {
    login,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

// ==============================
// Authentication Routes
// ==============================

// Login
router.post("/login", login);

// Forgot Password (Send OTP)
router.post("/forgot-password", forgotPassword);

// Reset Password (Verify OTP + Update Password)
router.post("/reset-password", resetPassword);

// Change password on first login
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { password, confirm_password } = req.body;
    if (!password || !confirm_password) {
      return res.status(400).json({ success: false, message: "All fields required." });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    const bcrypt = require("bcrypt");
    const hashed = await bcrypt.hash(password, 10);

    const db = req.db || require("../config/db").db;

    // Check if is_password_changed column exists, if not update without it or add it
    try {
      await db.query(
        "UPDATE users SET password = ?, is_password_changed = 1 WHERE id = ?",
        [hashed, req.user.id]
      );
    } catch (colErr) {
      if (colErr.message && colErr.message.includes("is_password_changed")) {
        // If column is missing, try adding column or update just password
        try {
          await db.query("ALTER TABLE users ADD COLUMN is_password_changed TINYINT(1) NOT NULL DEFAULT 0");
          await db.query(
            "UPDATE users SET password = ?, is_password_changed = 1 WHERE id = ?",
            [hashed, req.user.id]
          );
        } catch {
          await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashed, req.user.id]
          );
        }
      } else {
        throw colErr;
      }
    }

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("change-password error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error." });
  }
});

// GET /api/auth/me — Resolve user identity & subscription status from token
router.get("/me", verifyToken, async (req, res) => {
  try {
    const db = req.db || require("../config/db").db;
    const [rows] = await db.query(
      `SELECT u.id, u.role_id, u.full_name, u.username, u.email, u.phone, 
              u.profile_image, u.status, u.is_password_changed, r.role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.is_deleted = 0
       LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = {
      ...rows[0],
      is_impersonated: Boolean(req.user?.is_impersonated),
      impersonated_by: req.user?.impersonated_by || null,
    };
    const clientInfo = req.clientInfo;
    const subscriptionStatus = clientInfo?.status || "Active";

    return res.status(200).json({
      success: true,
      user,
      subscription: {
        status: subscriptionStatus,
        subscription_end: clientInfo?.subscription_end,
        grace_end_date: clientInfo?.grace_end_date,
        delete_date: clientInfo?.delete_date,
      },
    });
  } catch (err) {
    console.error("/me error:", err);
    return res.status(500).json({ success: false, message: "Failed to resolve session." });
  }
});

module.exports = router;
