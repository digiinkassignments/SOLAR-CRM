const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const {
  createQuotation,
  getQuotations,
  getQuotationById,
  getPublicQuotation,
  acceptPublicQuotation,
  updateQuotation,
  deleteQuotation,
  bulkDeleteQuotations,
  duplicateQuotation,
  updateQuotationStatus,
} = require("../controllers/quotationController");

// ── PUBLIC ROUTES (No Auth Required for Customer Proposal Web View) ──
router.get("/public/:token", getPublicQuotation);
router.post("/public/:token/accept", acceptPublicQuotation);

// ── AUTHENTICATED CRM ROUTES ──
router.get("/", verifyToken, getQuotations);
router.post("/", verifyToken, createQuotation);
router.post("/bulk-delete", verifyToken, bulkDeleteQuotations);
router.get("/:id", verifyToken, getQuotationById);
router.put("/:id", verifyToken, updateQuotation);
router.delete("/:id", verifyToken, deleteQuotation);
router.post("/:id/duplicate", verifyToken, duplicateQuotation);
router.patch("/:id/status", verifyToken, updateQuotationStatus);

module.exports = router;
