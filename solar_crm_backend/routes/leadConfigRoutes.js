const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  getLeadSources,
  createLeadSource,
  updateLeadSource,
  deleteLeadSource,
  getPipelineStatuses,
  createPipelineStatus,
  updatePipelineStatus,
  deletePipelineStatus,
  reorderPipelineStatuses,
} = require("../controllers/leadConfigController");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;

// ── Lead Sources ─────────────────────────────────────────────
router.get("/lead-sources", verifyToken, getLeadSources);
router.post("/lead-sources", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), createLeadSource);
router.put("/lead-sources/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), updateLeadSource);
router.delete("/lead-sources/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), deleteLeadSource);

// ── Pipeline Statuses ────────────────────────────────────────
router.get("/pipeline-statuses", verifyToken, getPipelineStatuses);
router.post("/pipeline-statuses", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), createPipelineStatus);
router.put("/pipeline-statuses/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), updatePipelineStatus);
router.delete("/pipeline-statuses/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), deletePipelineStatus);
router.post("/pipeline-statuses/reorder", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), reorderPipelineStatuses);

module.exports = router;
