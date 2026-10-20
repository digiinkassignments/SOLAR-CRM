// ========================================
// Role & Dynamic Permission Authorization
// ========================================

const { db: defaultDb } = require("../config/db");

// Backward-compatible role check (by role_id)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role_id)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource."
            });
        }
        next();
    };
};

// Granular Permission check (e.g. checkPermission("leads:view"))
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
            }

            // Role 1 (Super Admin) always has full bypass
            if (req.user.role_id === 1) {
                return next();
            }

            let permissions = req.user.permissions;

            // If permissions not in token, fetch from DB
            if (!permissions) {
                const db = req.db || defaultDb;
                const [rows] = await db.query(
                    `SELECT r.permissions FROM users u 
                     JOIN roles r ON r.id = u.role_id 
                     WHERE u.id = ? LIMIT 1`,
                    [req.user.id]
                );
                if (rows.length > 0 && rows[0].permissions) {
                    try {
                        permissions = typeof rows[0].permissions === "string" 
                            ? JSON.parse(rows[0].permissions) 
                            : rows[0].permissions;
                    } catch (e) {
                        permissions = [];
                    }
                } else {
                    permissions = [];
                }
                req.user.permissions = permissions;
            }

            if (Array.isArray(permissions) && permissions.includes(requiredPermission)) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: `Forbidden: You do not have permission for [${requiredPermission}].`
            });
        } catch (err) {
            console.error("checkPermission error:", err);
            return res.status(500).json({ success: false, message: "Permission verification failed." });
        }
    };
};

module.exports = {
    authorizeRoles,
    checkPermission
};