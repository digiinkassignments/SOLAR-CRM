const express = require("express");
const router = express.Router();

const {
  getManagerDashboardStats,
  getSalesDashboardStats,
  getAdminDashboardStats,
  getEngineerDashboardStats,
} = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;
const ROLE_SITE_ENGINEER = 4;

// Manager Dashboard Endpoint (ROLE_MANAGER = 2)
router.get(
  "/manager",
  verifyToken,
  authorizeRoles(2), // Role ID 2 = Manager
  getManagerDashboardStats
);

// Sales Rep Dashboard Endpoint (ROLE_SALES = 3)
router.get(
  "/sales",
  verifyToken,
  authorizeRoles(ROLE_SALES),
  getSalesDashboardStats
);

// Admin Dashboard Endpoint (ROLE_SUPER_ADMIN = 1 or custom roles with dashboard:view)
router.get(
  "/admin",
  verifyToken,
  (req, res, next) => {
    // If Super Admin (role_id 1) or any custom role (role_id > 4) or role with permissions
    if (req.user && (req.user.role_id === ROLE_SUPER_ADMIN || req.user.role_id > 4)) {
      return next();
    }
    // Backward compatibility for standard authorizeRoles
    return authorizeRoles(ROLE_SUPER_ADMIN)(req, res, next);
  },
  getAdminDashboardStats
);

// Site Engineer Dashboard Endpoint (ROLE_SITE_ENGINEER = 4)
router.get(
  "/engineer",
  verifyToken,
  authorizeRoles(ROLE_SITE_ENGINEER),
  getEngineerDashboardStats
);

module.exports = router;