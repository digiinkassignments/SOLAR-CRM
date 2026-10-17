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

module.exports = router;
