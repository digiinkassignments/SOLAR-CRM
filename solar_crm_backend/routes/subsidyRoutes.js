const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { currentAccess } = require('../middleware/subsidyAccess');
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
router.use(verifyToken, currentAccess);
router.get('/sync-report', async (req,res) => {
  if (!req.subsidyAccess.can_edit) return res.status(403).json({success:false,message:'Sync reports are restricted to tracker editors.'});
  try { res.json({success:true,data:await require('../services/subsidyReconciliation').report(req.db)}); }
  catch (error) { console.error('Subsidy sync report:',error.code || 'FAILED');res.status(503).json({success:false,message:'Sync report unavailable. Please retry.'}); }
});
router.get("/list", verifyToken, getAllSubsidiesHandler);
router.post("/apply", verifyToken, applySubsidyHandler);
router.get("/:leadId", verifyToken, getSubsidyByLeadHandler);
router.post("/upload-doc", verifyToken, uploadDocHandler);
router.put("/verify-doc/:docId", verifyToken, verifyDocHandler);
router.post("/reject", verifyToken, logRejectionHandler);
router.put("/resolve-fix/:id", verifyToken, resolveFixTaskHandler);

module.exports = router;
