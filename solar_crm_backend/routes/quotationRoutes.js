const governance = require("../services/quotationGovernance");
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
  sendQuotationEmail,
} = require("../controllers/quotationController");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

// ── PUBLIC ROUTES (No Auth Required for Customer Proposal Web View) ──
router.get("/public/:token", getPublicQuotation);
router.post("/public/:token/accept", governance.assertApproved, acceptPublicQuotation);

// ── AUTHENTICATED CRM ROUTES ──
router.get("/", verifyToken, getQuotations);
router.post("/", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), governance.writeGuard, createQuotation);
router.get("/:id", verifyToken, getQuotationById);
router.put("/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), governance.writeGuard, updateQuotation);
router.post("/:id/duplicate", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), (req,res,next)=>{req.governanceDuplicate=true;next();}, governance.writeGuard, duplicateQuotation);
router.post("/:id/send-email", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), governance.assertApproved, sendQuotationEmail);
router.patch("/:id/status", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), governance.assertApproved, updateQuotationStatus);

// Only Super Admin can delete quotations
router.post("/bulk-delete", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), bulkDeleteQuotations);
router.delete("/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), deleteQuotation);

module.exports = router;
