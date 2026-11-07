const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  applySubsidyHandler,
  getSubsidyByLeadHandler,
  uploadDocHandler,
  verifyDocHandler,
  logRejectionHandler,
  resolveFixTaskHandler,
  getAllSubsidiesHandler,
} = require("../controllers/subsidyController");

// ── PM Surya Ghar Subsidy Hub & Document Vault Routes ──
router.get("/list", verifyToken, getAllSubsidiesHandler);
router.post("/apply", verifyToken, applySubsidyHandler);
router.get("/:leadId", verifyToken, getSubsidyByLeadHandler);
router.post("/upload-doc", verifyToken, uploadDocHandler);
router.put("/verify-doc/:docId", verifyToken, verifyDocHandler);
router.post("/reject", verifyToken, logRejectionHandler);
router.put("/resolve-fix/:id", verifyToken, resolveFixTaskHandler);

module.exports = router;
