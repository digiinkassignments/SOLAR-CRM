// ============================================================
// ROLE CONTROLLER (Dynamic Custom RBAC for Solar CRM)
// Allows Admin to create, view, edit and delete custom roles
// with fine-grained feature & module permissions.
// ============================================================

const { db: defaultDb } = require("../config/db");

// Standard predefined permissions directory for Solar CRM
const AVAILABLE_PERMISSIONS = [
  // Dashboard & Analytics
  { id: "dashboard:view", label: "View Dashboard & Metrics", group: "Dashboard" },
  
  // User Management
  { id: "users:view", label: "View Team Members", group: "Users & Team" },
  { id: "users:create", label: "Add New Users", group: "Users & Team" },
  { id: "users:edit", label: "Edit Users", group: "Users & Team" },
  { id: "users:delete", label: "Delete / Deactivate Users", group: "Users & Team" },

  // Role Management
  { id: "roles:view", label: "View Roles & Permissions", group: "Roles & Permissions" },
  { id: "roles:create", label: "Create Custom Roles", group: "Roles & Permissions" },
  { id: "roles:edit", label: "Edit Role Permissions", group: "Roles & Permissions" },
  { id: "roles:delete", label: "Delete Custom Roles", group: "Roles & Permissions" },

  // Leads
  { id: "leads:view", label: "View Leads", group: "Leads Pipeline" },
  { id: "leads:create", label: "Add / Import Leads", group: "Leads Pipeline" },
  { id: "leads:edit", label: "Update Leads & Status", group: "Leads Pipeline" },
  { id: "leads:delete", label: "Delete Leads", group: "Leads Pipeline" },
  { id: "leads:export", label: "Export Leads to Excel/CSV", group: "Leads Pipeline" },

  // Customers
  { id: "customers:view", label: "View Customers", group: "Customers" },
  { id: "customers:create", label: "Add Customers", group: "Customers" },
  { id: "customers:edit", label: "Edit Customer Info", group: "Customers" },

  // Quotations & Calculator
  { id: "quotations:view", label: "View Quotations", group: "Quotations" },
  { id: "quotations:create", label: "Generate Quotations", group: "Quotations" },
  { id: "quotations:edit", label: "Edit / Revise Quotations", group: "Quotations" },
  { id: "quotations:delete", label: "Delete Quotations", group: "Quotations" },
  { id: "calculator:view", label: "Access Solar Calculator", group: "Quotations" },
  { id: "calculator:use", label: "Compute EPC & ROI Estimates", group: "Quotations" },

  // Invoices & Subsidy
  { id: "invoices:view", label: "View Invoices & Billing", group: "Finance" },
  { id: "invoices:create", label: "Create Invoices", group: "Finance" },
  { id: "invoices:edit", label: "Update Payments & Status", group: "Finance" },
  { id: "invoices:delete", label: "Cancel / Delete Invoices", group: "Finance" },
  { id: "subsidies:view", label: "View Subsidy Tracker", group: "Finance" },
  { id: "subsidies:edit", label: "Update DBT Subsidy Status", group: "Finance" },

  // Project Execution & Surveys
  { id: "projects:view", label: "View Solar Projects", group: "Projects" },
  { id: "projects:create", label: "Create / Schedule Projects", group: "Projects" },
  { id: "projects:edit", label: "Update Milestones & Logs", group: "Projects" },
  { id: "projects:delete", label: "Delete Projects", group: "Projects" },
  { id: "surveys:view", label: "View Site Surveys", group: "Site Surveys" },
  { id: "surveys:create", label: "Conduct / Add Site Survey", group: "Site Surveys" },
  { id: "surveys:edit", label: "Approve / Edit Site Surveys", group: "Site Surveys" },
  { id: "stock:view", label: "View Inventory & Stock", group: "Inventory" },
  { id: "stock:create", label: "Add Stock / Materials", group: "Inventory" },
  { id: "stock:edit", label: "Adjust Stock Levels", group: "Inventory" },
  { id: "stock:delete", label: "Delete Stock Records", group: "Inventory" },

  // Reports, Settings & AI
  { id: "reports:view", label: "View Analytics & Reports", group: "Reports & Insights" },
  { id: "reports:export", label: "Export Reports", group: "Reports & Insights" },
  { id: "settings:view", label: "View Company Settings", group: "Settings" },
  { id: "settings:edit", label: "Update Company Settings", group: "Settings" },
  { id: "ai_copilot:use", label: "Access Solar AI Copilot", group: "AI Features" },
];

// 1. Get Available Permissions Schema
const getAvailablePermissions = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: AVAILABLE_PERMISSIONS,
  });
};

// 2. Get All Roles (with user count & parsed permissions)
const getAllRoles = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const [roles] = await db.query(`
      SELECT 
        r.id,
        r.role_name,
        r.description,
        r.permissions,
        r.status,
        r.is_system,
        r.created_at,
        r.updated_at,
        COUNT(u.id) AS user_count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id AND u.is_deleted = 0
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.id ASC
    `);

    const formatted = roles.map((r) => {
      let perms = [];
      if (r.permissions) {
        try {
          perms = typeof r.permissions === "string" ? JSON.parse(r.permissions) : r.permissions;
        } catch (e) {
          perms = [];
        }
      }
      return {
        ...r,
        permissions: Array.isArray(perms) ? perms : [],
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error("getAllRoles error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch roles." });
  }
};

// 3. Create Custom Role
const createRole = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { role_name, description, permissions } = req.body;

    if (!role_name || !String(role_name).trim()) {
      return res.status(400).json({ success: false, message: "Role name is required." });
    }

    const trimmedName = String(role_name).trim();

    // Check duplicate
    const [exists] = await db.query(
      "SELECT id FROM roles WHERE LOWER(role_name) = LOWER(?) LIMIT 1",
      [trimmedName]
    );
    if (exists.length > 0) {
      return res.status(400).json({ success: false, message: "A role with this name already exists." });
    }

    const permsJson = JSON.stringify(Array.isArray(permissions) ? permissions : []);

    let insertResult;
    try {
      const [result] = await db.query(
        `INSERT INTO roles (role_name, description, permissions, status, is_system)
         VALUES (?, ?, ?, 'Active', 0)`,
        [trimmedName, description || null, permsJson]
      );
      insertResult = result;
    } catch (insertErr) {
      // If permissions or is_system column was not created yet in this specific tenant DB, add it and retry
      if (insertErr.message && (insertErr.message.includes("permissions") || insertErr.message.includes("is_system") || insertErr.message.includes("Unknown column"))) {
        try {
          await db.query("ALTER TABLE `roles` ADD COLUMN IF NOT EXISTS `permissions` JSON NULL AFTER `description`");
          await db.query("ALTER TABLE `roles` ADD COLUMN IF NOT EXISTS `is_system` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`");
          const [retryResult] = await db.query(
            `INSERT INTO roles (role_name, description, permissions, status, is_system)
             VALUES (?, ?, ?, 'Active', 0)`,
            [trimmedName, description || null, permsJson]
          );
          insertResult = retryResult;
        } catch (retryErr) {
          throw insertErr;
        }
      } else {
        throw insertErr;
      }
    }

    return res.status(201).json({
      success: true,
      message: `Role "${trimmedName}" created successfully.`,
      role_id: insertResult.insertId,
    });
  } catch (err) {
    console.error("createRole error:", err);
    return res.status(500).json({ success: false, message: err.sqlMessage || err.message || "Failed to create custom role." });
  }
};

// 4. Update Role & Permissions
const updateRole = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const roleId = parseInt(req.params.id, 10);
    const { role_name, description, permissions, status } = req.body;

    if (!roleId) {
      return res.status(400).json({ success: false, message: "Invalid role ID." });
    }

    const [existing] = await db.query("SELECT * FROM roles WHERE id = ? LIMIT 1", [roleId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Role not found." });
    }

    const role = existing[0];

    // System roles protection: Super Admin role name cannot be renamed
    const updatedName = role.is_system && role.id === 1 ? role.role_name : (role_name ? String(role_name).trim() : role.role_name);

    // If changing name, ensure uniqueness
    if (updatedName.toLowerCase() !== role.role_name.toLowerCase()) {
      const [dup] = await db.query(
        "SELECT id FROM roles WHERE LOWER(role_name) = LOWER(?) AND id != ? LIMIT 1",
        [updatedName, roleId]
      );
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: "Another role with this name already exists." });
      }
    }

    const permsJson = permissions !== undefined
      ? JSON.stringify(Array.isArray(permissions) ? permissions : [])
      : role.permissions;

    await db.query(
      `UPDATE roles
       SET role_name = ?, description = ?, permissions = ?, status = COALESCE(?, status)
       WHERE id = ?`,
      [updatedName, description !== undefined ? description : role.description, permsJson, status || null, roleId]
    );

    return res.status(200).json({
      success: true,
      message: `Role "${updatedName}" updated successfully.`,
    });
  } catch (err) {
    console.error("updateRole error:", err);
    return res.status(500).json({ success: false, message: "Failed to update role." });
  }
};

// 5. Delete Custom Role
const deleteRole = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const roleId = parseInt(req.params.id, 10);

    const [existing] = await db.query("SELECT * FROM roles WHERE id = ? LIMIT 1", [roleId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Role not found." });
    }

    if (existing[0].is_system || existing[0].id === 1) {
      return res.status(403).json({
        success: false,
        message: "Built-in system roles cannot be deleted.",
      });
    }

    // Check if any active user is assigned to this role
    const [assigned] = await db.query(
      "SELECT id, full_name FROM users WHERE role_id = ? AND is_deleted = 0 LIMIT 5",
      [roleId]
    );
    if (assigned.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. There are ${assigned.length} active user(s) assigned to this role (${assigned.map(u => u.full_name).join(", ")}). Please reassign or delete those users first.`,
      });
    }

    // Set role_id = NULL or reassign any soft-deleted historical users to prevent FK constraint failure
    try {
      await db.query("UPDATE users SET role_id = NULL WHERE role_id = ? AND is_deleted = 1", [roleId]);
    } catch (e) {
      // Ignore if role_id does not allow NULL
    }

    await db.query("DELETE FROM roles WHERE id = ?", [roleId]);

    return res.status(200).json({
      success: true,
      message: "Custom role deleted successfully.",
    });
  } catch (err) {
    console.error("deleteRole error:", err);
    // If MySQL Foreign Key constraint error (ER_ROW_IS_REFERENCED_2 / 1451)
    if (err.code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete this role because one or more users are linked to it. Please reassign those users first.",
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to delete role." 
    });
  }
};

module.exports = {
  AVAILABLE_PERMISSIONS,
  getAvailablePermissions,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
};
