// ============================================================
// ROLE & PERMISSIONS ROUTES
// Endpoints for managing custom roles and dynamic permissions
// ============================================================

const express = require("express");
const router = express.Router();

const {
  getAvailablePermissions,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// All role management endpoints require Admin access (Role 1)
router.use(verifyToken);

// 1. Get List of all available system permissions (for checkboxes UI)
router.get("/permissions", getAvailablePermissions);

// 2. Get All Roles (used by User Create dropdown and Roles Management UI)
// Both Admin and Manager can view roles list to assign
router.get("/", authorizeRoles(1, 2), getAllRoles);

// 3. Create Custom Role (Admin only)
router.post("/", authorizeRoles(1), createRole);

// 4. Update Role & Permissions (Admin only)
router.put("/:id", authorizeRoles(1), updateRole);

// 5. Delete Custom Role (Admin only)
router.delete("/:id", authorizeRoles(1), deleteRole);

module.exports = router;
