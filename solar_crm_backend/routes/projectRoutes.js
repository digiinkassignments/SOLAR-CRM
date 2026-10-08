const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

const { verifyToken } = require("../middleware/authMiddleware");
const { clientDbMiddleware } = require("../config/clientDb");

// Middleware aliases
const authMiddleware = verifyToken;

// ── PROTECTED CRM ROUTES (All project endpoints require auth & client DB injection) ──
router.use(authMiddleware);
if (typeof clientDbMiddleware === "function") {
  router.use(clientDbMiddleware);
}

// ── PROJECT ROUTES ──
router.get("/", projectController.getAllProjects);
router.get("/stats", projectController.getProjectStats);
router.get("/:id", projectController.getProjectById);
router.post("/", projectController.createProject);
router.put("/:id/stage", projectController.updateProjectStage);
router.put("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);

module.exports = router;
