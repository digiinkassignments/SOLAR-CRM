const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createLead, getLeads, getLeadById, getTeamFollowupsList, updateLead, updateLeadStatus,
  assignLead, bulkReassign, bulkImport, addFollowup, getFollowups, getActivityLogs, deleteLead,
  bulkDeleteLeads, getDateWiseFollowups, getBirthdayEvents, sendClientWish,
} = require("../controllers/leadController");

const {
  generateQuotationPDF,
  generateInvoicePDF,
} = require("../controllers/pdfController");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

router.get("/", verifyToken, getLeads);
router.post("/", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), createLead);

// ⚠️ /:id se UPAR rakhna zaroori hai
router.patch("/bulk-reassign", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), bulkReassign);
router.post("/bulk-import", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), bulkImport);
router.post("/bulk-delete", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), bulkDeleteLeads);
router.get("/team/followups", verifyToken, authorizeRoles(ROLE_MANAGER), getTeamFollowupsList);

// Date-wise Follow-ups (Today, Overdue, Upcoming, Custom Date Filter)
router.get("/followups/calendar", verifyToken, getDateWiseFollowups);

// Birthday & Anniversary Events / Wish Dispatcher
router.get("/events/birthdays", verifyToken, getBirthdayEvents);
router.post("/events/send-wish", verifyToken, sendClientWish);

// PDF Generation Routes
router.get("/:id/quotation-pdf", verifyToken, generateQuotationPDF);
router.get("/:id/invoice-pdf", verifyToken, generateInvoicePDF);

router.get("/:id", verifyToken, getLeadById);
router.put("/:id", verifyToken, updateLead);
router.patch("/:id/status", verifyToken, updateLeadStatus);
router.post("/:id/assign", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), assignLead);
router.post("/:id/followups", verifyToken, addFollowup);
router.get("/:id/followups", verifyToken, getFollowups);
router.get("/:id/logs", verifyToken, getActivityLogs);
router.delete("/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN), deleteLead);

module.exports = router;