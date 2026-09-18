// ============================================================
// SUPER ADMIN ROUTES
// All routes: /api/superadmin/...
// ============================================================

const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");

const {
  login,
  getDashboard,
  getAllClients, getClientById, createClient,
  renewClient, updateClientStatus, deleteClient,
  getPlans, updatePlan,
  getPaymentRequests, confirmPayment, rejectPayment,
  getMasterSettings, updateMasterSettings,
} = require("../controllers/superAdminController");

// ============================================================
// Super Admin Auth Middleware
// ============================================================
const verifySuperAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Access denied." });
  }
  try {
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET
    );
    if (decoded.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    req.superAdmin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

// ── Auth ─────────────────────────────────────────────────────
router.post("/auth/login", login);

// ── Dashboard ────────────────────────────────────────────────
router.get("/dashboard", verifySuperAdmin, getDashboard);

// ── Clients ──────────────────────────────────────────────────
router.get("/clients",              verifySuperAdmin, getAllClients);
router.get("/clients/:id",          verifySuperAdmin, getClientById);
router.post("/clients",             verifySuperAdmin, createClient);
router.post("/clients/:id/renew",   verifySuperAdmin, renewClient);
router.patch("/clients/:id/status", verifySuperAdmin, updateClientStatus);
router.delete("/clients/:id",       verifySuperAdmin, deleteClient);

// ── Plans ────────────────────────────────────────────────────
router.get("/plans",        verifySuperAdmin, getPlans);
router.put("/plans/:id",    verifySuperAdmin, updatePlan);

// ── Payments ─────────────────────────────────────────────────
router.get("/payments",                   verifySuperAdmin, getPaymentRequests);
router.post("/payments/:id/confirm",      verifySuperAdmin, confirmPayment);
router.post("/payments/:id/reject",       verifySuperAdmin, rejectPayment);

// ── Settings ─────────────────────────────────────────────────
router.get("/settings",  verifySuperAdmin, getMasterSettings);
router.put("/settings",  verifySuperAdmin, updateMasterSettings);

module.exports = router;
