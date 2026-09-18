const bcrypt    = require("bcrypt");
const jwt       = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const {
  getUserByLogin, updateLastLogin,
  getUserForForgotPassword, deleteOldOTP,
  saveResetOTP, getValidOTP, verifyOTP, updatePassword,
} = require("../models/authModel");

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,
  port:   process.env.MAIL_PORT,
  secure: false,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

// ============================================================
// LOGIN
// ============================================================
const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ success: false, message: "Login ID and Password are required." });
    }

    // Deleted client — block
    const clientInfo = req.clientInfo;
    if (clientInfo && clientInfo.status === "Deleted") {
      return res.status(410).json({
        success: false,
        subscription_status: "Deleted",
        message: "This account has been permanently deleted.",
      });
    }

    const { db: defaultDb } = require("../config/db");
    const db = req.db || defaultDb;

    const users = await getUserByLogin(login, db);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    const user = users[0];

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact the administrator.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid login credentials." });
    }

    const token = jwt.sign(
      { id: user.id, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await updateLastLogin(user.id, db);
    delete user.password;

    const subscriptionStatus = clientInfo?.status || "Active";
    const warning            = req.subscriptionWarning || null;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user,
      subscription: {
        status:           subscriptionStatus,
        subscription_end: clientInfo?.subscription_end,
        grace_end_date:   clientInfo?.grace_end_date,
        delete_date:      clientInfo?.delete_date,
        warning,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================
const forgotPassword = async (req, res) => {
  try {
    const { login } = req.body;
    if (!login) {
      return res.status(400).json({ success: false, message: "Username, Email or Phone is required." });
    }

    const { db: defaultDb } = require("../config/db");
    const db    = req.db || defaultDb;
    const users = await getUserForForgotPassword(login, db);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    const user    = users[0];
    const otp     = Math.floor(1000 + Math.random() * 9000).toString();
    const hashed  = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await deleteOldOTP(user.id, db);
    await saveResetOTP(user.id, hashed, expires, db);

    await transporter.sendMail({
      from:    process.env.MAIL_FROM,
      to:      user.email,
      subject: "Solar CRM Password Reset OTP",
      html: `
        <h2>Hello ${user.full_name},</h2>
        <p>Your Password Reset OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>Solar CRM</p>
      `,
    });

    return res.status(200).json({ success: true, message: "OTP sent successfully." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// RESET PASSWORD
// ============================================================
const resetPassword = async (req, res) => {
  try {
    const { login, otp, password, confirm_password } = req.body;

    if (!login || !otp || !password || !confirm_password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const { db: defaultDb } = require("../config/db");
    const db    = req.db || defaultDb;
    const users = await getUserForForgotPassword(login, db);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    const user    = users[0];
    const otpRows = await getValidOTP(user.id, db);
    if (otpRows.length === 0) {
      return res.status(400).json({ success: false, message: "OTP expired." });
    }

    const otpData = otpRows[0];
    const isMatch = await bcrypt.compare(otp, otpData.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await updatePassword(user.id, hashed, db);
    await verifyOTP(otpData.id, db);

    return res.status(200).json({ success: true, message: "Password updated successfully." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

module.exports = { login, forgotPassword, resetPassword };