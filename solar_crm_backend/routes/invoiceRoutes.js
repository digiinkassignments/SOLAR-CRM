const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  getPublicInvoice,
  recordPayment,
  deleteInvoice,
  bulkDeleteInvoices,
} = require("../controllers/invoiceController");

// ── PUBLIC ROUTE (Customer Web View / PDF download) ──
router.get("/public/:token", getPublicInvoice);

// ── AUTHENTICATED CRM ROUTES ──
router.get("/", verifyToken, getInvoices);
router.post("/", verifyToken, createInvoice);
router.post("/bulk-delete", verifyToken, bulkDeleteInvoices);
router.get("/:id", verifyToken, getInvoiceById);
router.post("/:id/payments", verifyToken, recordPayment);
router.delete("/:id", verifyToken, deleteInvoice);

module.exports = router;
