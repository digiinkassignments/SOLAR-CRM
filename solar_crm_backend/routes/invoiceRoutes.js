const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  getPublicInvoice,
  recordPayment,
  deleteInvoice,
  bulkDeleteInvoices,
} = require("../controllers/invoiceController");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

// ── PUBLIC ROUTE (Customer Web View / PDF download) ──
router.get("/public/:token", getPublicInvoice);

// ── AUTHENTICATED CRM ROUTES ──
// All authenticated users can view their invoices
router.get("/", verifyToken, getInvoices);
router.get("/:id", verifyToken, getInvoiceById);

// Only Super Admin & Manager can create invoices and record payments (Sales is Read-Only)
router.post("/", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), createInvoice);
router.post("/:id/payments", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), recordPayment);

// Only Super Admin can delete invoices
router.post("/bulk-delete", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN), bulkDeleteInvoices);
router.delete("/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN), deleteInvoice);

module.exports = router;
