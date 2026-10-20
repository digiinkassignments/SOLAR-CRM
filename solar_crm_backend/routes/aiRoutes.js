const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  getLeadCopilotAnalysis,
  getProposalSavingsAnalysis
} = require("../controllers/aiCopilotController");

// Protected Route: GET /api/ai/lead-copilot/:id
router.get("/lead-copilot/:id", verifyToken, getLeadCopilotAnalysis);

// Route: POST /api/ai/proposal-analysis (available for proposal calculations & dynamic views)
router.post("/proposal-analysis", getProposalSavingsAnalysis);

module.exports = router;
