const bcrypt = require("bcrypt");

const {
    checkUsernameExists,
    checkEmailExists,
    checkPhoneExists,
    releaseDeletedUserUniqueField,
    createUser,
    getAllUsers,
    getTotalUsersCount,
    getUserById,
    checkUsernameExistsForUpdate,
    checkEmailExistsForUpdate,
    checkPhoneExistsForUpdate,
    updateUser,
    updateUserStatus,
    softDeleteUser,
    getTeamMembersByManager
} = require("../models/userModel");

// Helper function to extract friendly error message from DB exceptions
const getDatabaseErrorMessage = (error, defaultMsg = "Failed to save user.") => {
    if (!error) return defaultMsg;
    const sqlMsg = error.sqlMessage || error.message || "";

    if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        if (sqlMsg.includes("email") || sqlMsg.includes("users.email") || sqlMsg.includes("uq_email")) {
            return "Email address is already registered in the system. Please use a different email.";
        }
        if (sqlMsg.includes("username") || sqlMsg.includes("users.username") || sqlMsg.includes("uq_username")) {
            return "Username is already taken. Please choose a different username.";
        }
        if (sqlMsg.includes("phone") || sqlMsg.includes("users.phone") || sqlMsg.includes("uq_phone")) {
            return "Phone number is already registered with another user.";
        }
        const dupValue = sqlMsg.split("for key")[0].replace("Duplicate entry", "").trim();
        return `Duplicate record detected: ${dupValue || "value"} is already in use.`;
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2" || error.errno === 1452) {
        if (sqlMsg.includes("manager_id") || sqlMsg.includes("fk_manager")) {
            return "Selected Reporting Manager does not exist in the database. Please select a valid Manager.";
        }
        if (sqlMsg.includes("role_id") || sqlMsg.includes("fk_role")) {
            return "Selected Role is invalid or not found.";
        }
        return "Invalid reference provided for Role or Reporting Manager.";
    }

    if (error.code === "ER_DATA_TOO_LONG" || error.errno === 1406) {
        return "One of the provided values exceeds maximum allowed character length in database.";
    }

    if (error.code === "ER_BAD_NULL_ERROR" || error.errno === 1048) {
        return `Required field cannot be null: ${sqlMsg}`;
    }

    return sqlMsg || error.message || defaultMsg;
};

// ======================================
// Create User
// ======================================
const createUserController = async (req, res) => {
    try {
        let { role_id, manager_id, full_name, username, email, phone, password } = req.body;

        // Clean & sanitize input values
        full_name = full_name ? String(full_name).trim() : "";
        username = username ? String(username).trim().toLowerCase() : "";
        email = email ? String(email).trim().toLowerCase() : "";
        phone = phone ? String(phone).trim() : "";

        if (!role_id || !full_name || !username || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required. Please check Full Name, Username, Email, Phone, Role and Password."
            });
        }

        // Validate Sales Representative manager requirement
        if (Number(role_id) === 3 && (!manager_id || manager_id === "")) {
            return res.status(400).json({
                success: false,
                message: "Reporting Manager is required when assigning the Sales Representative role."
            });
        }

        const db = req.db;

        // 1. Check Username
        const usernameRows = await checkUsernameExists(username, db);
        if (usernameRows && usernameRows.length > 0) {
            const match = usernameRows[0];
            if (match.is_deleted === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Username '${username}' is already taken. Please choose another username.`
                });
            } else {
                // Free up soft-deleted record's username
                await releaseDeletedUserUniqueField(match.id, "username", db);
            }
        }

        // 2. Check Email
        const emailRows = await checkEmailExists(email, db);
        if (emailRows && emailRows.length > 0) {
            const match = emailRows[0];
            if (match.is_deleted === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Email '${email}' is already registered with another user account.`
                });
            } else {
                // Free up soft-deleted record's email
                await releaseDeletedUserUniqueField(match.id, "email", db);
            }
        }

        // 3. Check Phone
        const phoneRows = await checkPhoneExists(phone, db);
        if (phoneRows && phoneRows.length > 0) {
            const match = phoneRows[0];
            if (match.is_deleted === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Phone number '${phone}' is already registered with another user.`
                });
            } else {
                // Free up soft-deleted record's phone
                await releaseDeletedUserUniqueField(match.id, "phone", db);
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await createUser({
            role_id: Number(role_id),
            manager_id: manager_id ? Number(manager_id) : null,
            full_name,
            username,
            email,
            phone,
            password: hashedPassword,
            created_by: req.user?.id || null
        }, db);

        return res.status(201).json({
            success: true,
            message: "User created successfully."
        });

    } catch (error) {
        console.error("Create User Error:", error);
        const friendlyMessage = getDatabaseErrorMessage(error, "Failed to create user account.");
        return res.status(400).json({
            success: false,
            message: friendlyMessage
        });
    }
};

// ======================================
// Get All Users
// ======================================
const getUsersController = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const role = req.query.role || "";
        const status = req.query.status || "";

        const offset = (page - 1) * limit;

        const db = req.db;

        const [users, totalRecords] = await Promise.all([
            getAllUsers(offset, limit, search, role, status, db),
            getTotalUsersCount(search, role, status, db)
        ]);

        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully.",
            data: users,
            pagination: {
                page,
                limit,
                totalRecords,
                totalPages
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });
    }
};

// ======================================
// Get User By ID
// ======================================
const getUserByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        const db = req.db;

        const user = await getUserById(id, db);

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "User fetched successfully.",
            data: user[0]
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });
    }
};

// ======================================
// Get Team Members (Manager Only)
// ======================================
const getTeamMembersController = async (req, res) => {
    try {
        const managerId = req.user ? req.user.id : null;

        if (!managerId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized request."
            });
        }

        const db = req.db;

        const teamMembers = await getTeamMembersByManager(managerId, db);

        return res.status(200).json({
            success: true,
            message: "Team members fetched successfully.",
            data: teamMembers
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });
    }
};

// ======================================
// Update User
// ======================================
const updateUserController = async (req, res) => {
    try {
        const { id } = req.params;
        const { role_id, manager_id, full_name, username, email, phone } = req.body;

        if (!role_id || !full_name || !username || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        if (role_id == 3 && !manager_id) {
            return res.status(400).json({
                success: false,
                message: "Manager is required for Sales Person."
            });
        }

        const db = req.db;

        if ((await checkUsernameExistsForUpdate(username, id, db)).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Username already exists."
            });
        }

        if ((await checkEmailExistsForUpdate(email, id, db)).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists."
            });
        }

        if ((await checkPhoneExistsForUpdate(phone, id, db)).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Phone number already exists."
            });
        }

        const result = await updateUser({
            id,
            role_id: Number(role_id),
            manager_id: manager_id ? Number(manager_id) : null,
            full_name: String(full_name).trim(),
            username: String(username).trim().toLowerCase(),
            email: String(email).trim().toLowerCase(),
            phone: String(phone).trim()
        }, db);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found or already deleted."
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully."
        });

    } catch (error) {
        console.error("Update User Error:", error);
        const friendlyMessage = getDatabaseErrorMessage(error, "Failed to update user details.");
        return res.status(400).json({
            success: false,
            message: friendlyMessage
        });
    }
};

// ======================================
// Update User Status
// ======================================
const updateUserStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (Number(req.user.id) === Number(id)) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own account status."
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required."
            });
        }

        if (status !== "Active" && status !== "Inactive") {
            return res.status(400).json({
                success: false,
                message: "Invalid status."
            });
        }

        const db = req.db;

        const result = await updateUserStatus(id, status, db);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "User status updated successfully."
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });
    }
};

// ======================================
// Soft Delete User
// ======================================
const deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;

        if (Number(req.user.id) === Number(id)) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account."
            });
        }

        const { db: defaultDb } = require("../config/db");
        const db = req.db || defaultDb;

        const result = await softDeleteUser(id, db);

        if (!result || result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found or already deleted."
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully."
        });

    } catch (error) {
        console.error("deleteUserController error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete user."
        });
    }
};

// ======================================
// Update FCM Token
// ======================================
const updateFcmTokenController = async (req, res) => {
    try {
        const { fcm_token } = req.body;
        const userId = req.user.id;

        if (!fcm_token) {
            return res.status(400).json({ success: false, message: "FCM token required." });
        }

        const db = req.db;
        await db.query("UPDATE users SET fcm_token = ? WHERE id = ?", [fcm_token, userId]);
        return res.status(200).json({ success: true, message: "FCM token updated." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

module.exports = {
    createUser: createUserController,
    getUsers: getUsersController,
    getUserById: getUserByIdController,
    getTeamMembers: getTeamMembersController,
    updateUser: updateUserController,
    updateUserStatus: updateUserStatusController,
    deleteUser: deleteUserController,
    updateFcmToken: updateFcmTokenController
};