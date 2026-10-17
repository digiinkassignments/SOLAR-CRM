const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { clientDbMiddleware } = require("../config/clientDb");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SITE_ENGINEER = 4;

// Middleware aliases
const authMiddleware = verifyToken;

// ── PROTECTED CRM ROUTES (All project endpoints require auth & client DB injection) ──
router.use(authMiddleware);
if (typeof clientDbMiddleware === "function") {
  router.use(clientDbMiddleware);
}

// ── PROJECT ROUTES ──
// View routes allowed for Admin & Manager & Site Engineer
router.get("/stats", projectController.getProjectStats);
router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);

// Creation & Stage update
router.post("/", authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), projectController.createProject);
router.put("/:id/stage", authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SITE_ENGINEER), projectController.updateProjectStage);
router.put("/:id", authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SITE_ENGINEER), projectController.updateProject);

// Only Super Admin can delete a project
router.delete("/:id", authorizeRoles(ROLE_SUPER_ADMIN), projectController.deleteProject);

module.exports = router;
