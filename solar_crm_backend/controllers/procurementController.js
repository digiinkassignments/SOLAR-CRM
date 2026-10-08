const procurementModel = require("../models/procurementModel");
const dbConfig = require("../config/db");
const defaultDb = dbConfig.db || dbConfig.defaultDb;

// 1. Get All Purchase Orders
const getAllPurchaseOrders = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const filters = {
      project_id: req.query.project_id,
      status: req.query.status,
      search: req.query.search,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 15,
    };

    const data = await procurementModel.getAllPurchaseOrders(db, filters);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getAllPurchaseOrders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get Single Purchase Order By ID
const getPurchaseOrderById = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    const order = await procurementModel.getPurchaseOrderById(db, id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found.",
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("getPurchaseOrderById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Create Purchase Order
const createPurchaseOrder = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const userId = req.user?.id || null;
    const { vendor_name, project_id, items } = req.body;

    if (!vendor_name || !project_id || !items) {
      return res.status(400).json({
        success: false,
        message: "vendor_name, project_id, and items are required.",
      });
    }

    if (Array.isArray(items) && items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "items list cannot be empty.",
      });
    }

    const insertId = await procurementModel.createPurchaseOrder(
      db,
      req.body,
      userId
    );

    return res.status(201).json({
      success: true,
      message: "Purchase order created successfully.",
      data: { id: insertId },
    });
  } catch (error) {
    console.error("createPurchaseOrder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Update Purchase Order
const updatePurchaseOrder = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    const updated = await procurementModel.updatePurchaseOrder(
      db,
      id,
      req.body
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message:
          "No valid fields provided to update or purchase order not found.",
      });
    }

    return res.json({
      success: true,
      message: "Purchase order updated successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("updatePurchaseOrder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Update PO Status
const updatePOStatus = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;
    const { status, actual_delivery_date } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required.",
      });
    }

    const updated = await procurementModel.updatePOStatus(
      db,
      id,
      status,
      actual_delivery_date
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found or already deleted.",
      });
    }

    return res.json({
      success: true,
      message: "Purchase order status updated successfully.",
      data: { id, status, actual_delivery_date },
    });
  } catch (error) {
    console.error("updatePOStatus error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Delete Purchase Order (Soft Delete, Admin/Manager Only)
const deletePurchaseOrder = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const { id } = req.params;

    // Role check: Only Admin and Manager are allowed
    const roleId = Number(req.user?.role_id);
    const roleName = String(
      req.user?.role_name || req.user?.role || ""
    ).toLowerCase();
    const isAllowed =
      roleId === 1 ||
      roleId === 2 ||
      roleName.includes("admin") ||
      roleName.includes("manager") ||
      roleName.includes("super");

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Admins and Managers can delete purchase orders.",
      });
    }

    const deleted = await procurementModel.softDeletePO(db, id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found or already deleted.",
      });
    }

    return res.json({
      success: true,
      message: "Purchase order deleted successfully.",
    });
  } catch (error) {
    console.error("deletePurchaseOrder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 7. Get Procurement Statistics
const getProcurementStats = async (req, res) => {
  try {
    const db = req.db || defaultDb;
    const stats = await procurementModel.getProcurementStats(db);
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("getProcurementStats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePOStatus,
  deletePurchaseOrder,
  getProcurementStats,
};
