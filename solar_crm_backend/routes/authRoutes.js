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

module.exports = router;
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
    await req.db.query(
      "UPDATE users SET password = ?, is_password_changed = 1 WHERE id = ?",
      [hashed, req.user.id]
    );
    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("change-password error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
});
