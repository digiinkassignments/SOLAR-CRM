const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  createLoanHandler,
  getAllLoansHandler,
  getLoanStatsHandler,
  getLoanByIdHandler,
  getLoanByLeadHandler,
  getLoanByProjectHandler,
  updateLoanHandler,
  deleteLoanHandler,
  uploadLoanDocHandler,
} = require("../controllers/loanController");

// ── Solar Rooftop Loan & Financing Hub Routes ──
router.post("/", verifyToken, createLoanHandler);
router.get("/", verifyToken, getAllLoansHandler);
router.get("/stats", verifyToken, getLoanStatsHandler);
router.get("/lead/:leadId", verifyToken, getLoanByLeadHandler);
router.get("/project/:projectId", verifyToken, getLoanByProjectHandler);
router.get("/:id", verifyToken, getLoanByIdHandler);
router.put("/:id", verifyToken, updateLoanHandler);
router.delete("/:id", verifyToken, deleteLoanHandler);
router.post("/:id/upload-doc", verifyToken, uploadLoanDocHandler);

module.exports = router;
