const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  applySubsidyHandler,
  getSubsidyByLeadHandler,
  uploadDocHandler,
  verifyDocHandler,
} = require("../controllers/subsidyController");

// ── PM Surya Ghar Subsidy Hub & Document Vault Routes ──
router.post("/apply", verifyToken, applySubsidyHandler);
router.get("/:leadId", verifyToken, getSubsidyByLeadHandler);
router.post("/upload-doc", verifyToken, uploadDocHandler);
router.put("/verify-doc/:docId", verifyToken, verifyDocHandler);

module.exports = router;
