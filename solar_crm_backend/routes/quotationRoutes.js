const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
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

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

// ── PUBLIC ROUTES (No Auth Required for Customer Proposal Web View) ──
router.get("/public/:token", getPublicQuotation);
router.post("/public/:token/accept", acceptPublicQuotation);

// ── AUTHENTICATED CRM ROUTES ──
router.get("/", verifyToken, getQuotations);
router.post("/", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), createQuotation);
router.get("/:id", verifyToken, getQuotationById);
router.put("/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), updateQuotation);
router.post("/:id/duplicate", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), duplicateQuotation);
router.patch("/:id/status", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), updateQuotationStatus);

// Only Super Admin can delete quotations
router.post("/bulk-delete", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN), bulkDeleteQuotations);
router.delete("/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN), deleteQuotation);

module.exports = router;
