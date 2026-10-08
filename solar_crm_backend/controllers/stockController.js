const stockModel = require("../models/stockModel");

// Get Categories
const getCategories = async (req, res) => {
  try {
    const categories = await stockModel.getCategories(req.db);
    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error("getCategories error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Items List
const getItems = async (req, res) => {
  try {
    const result = await stockModel.getItems(req.db, req.query);
    return res.json({ success: true, data: result.items, pagination: { total: result.total, page: result.page, limit: result.limit } });
  } catch (error) {
    console.error("getItems error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Item by ID
const getItemById = async (req, res) => {
  try {
    const item = await stockModel.getItemById(req.db, req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Stock item not found." });
    }
    return res.json({ success: true, data: item });
  } catch (error) {
    console.error("getItemById error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create Item
const createItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    const body = req.body;

    if (!body.category_id || !body.name) {
      return res.status(400).json({ success: false, message: "Category and Item Name are required." });
    }

    let imageUrl = body.image_url || null;
    if (req.file) {
      imageUrl = `/uploads/stock/${req.file.filename}`;
    }

    let specifications = body.specifications;
    if (typeof specifications === "string") {
      try { specifications = JSON.parse(specifications); } catch (e) {}
    }

    const newItem = await stockModel.createItem(
      req.db,
      {
        ...body,
        image_url: imageUrl,
        specifications,
      },
      userId
    );

    return res.status(201).json({ success: true, message: "Stock item created successfully.", data: newItem });
  } catch (error) {
    console.error("createItem error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Item
const updateItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const body = req.body;

    let imageUrl = body.image_url;
    if (req.file) {
      imageUrl = `/uploads/stock/${req.file.filename}`;
    }

    let specifications = body.specifications;
    if (typeof specifications === "string") {
      try { specifications = JSON.parse(specifications); } catch (e) {}
    }

    const updated = await stockModel.updateItem(
      req.db,
      id,
      {
        ...body,
        image_url: imageUrl,
        specifications,
      },
      userId
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Stock item not found." });
    }

    return res.json({ success: true, message: "Stock item updated successfully.", data: updated });
  } catch (error) {
    console.error("updateItem error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await stockModel.deleteItem(req.db, id);
    return res.json({
      success: true,
      message: result.softDeleted ? "Stock item deactivated." : "Stock item deleted.",
    });
  } catch (error) {
    console.error("deleteItem error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Delete Items
const bulkDeleteItems = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of item IDs to delete." });
    }
    const result = await stockModel.bulkDeleteItems(req.db, ids);
    return res.json({
      success: true,
      message: `${result.softDeleted + result.hardDeleted} stock items processed successfully.`,
      data: result,
    });
  } catch (error) {
    console.error("bulkDeleteItems error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create Stock Transaction (Stock IN / Stock OUT)
const createTransaction = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await stockModel.createTransaction(req.db, req.body, userId);
    return res.status(201).json({
      success: true,
      message: `Stock ${req.body.transaction_type} recorded successfully.`,
      data: result,
    });
  } catch (error) {
    console.error("createTransaction error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Transactions
const getTransactions = async (req, res) => {
  try {
    const result = await stockModel.getTransactions(req.db, req.query);
    return res.json({
      success: true,
      data: result.transactions,
      pagination: { total: result.total, page: result.page, limit: result.limit },
    });
  } catch (error) {
    console.error("getTransactions error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Stock Alerts
const getAlerts = async (req, res) => {
  try {
    const alerts = await stockModel.getAlerts(req.db, req.query);
    return res.json({ success: true, data: alerts });
  } catch (error) {
    console.error("getAlerts error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Resolve Stock Alert
const resolveAlert = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    await stockModel.resolveAlert(req.db, id, userId);
    return res.json({ success: true, message: "Stock alert resolved successfully." });
  } catch (error) {
    console.error("resolveAlert error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Stock Valuation Report
const getStockReport = async (req, res) => {
  try {
    const report = await stockModel.getStockReport(req.db);
    return res.json({ success: true, data: report });
  } catch (error) {
    console.error("getStockReport error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Import Stock Items
const bulkImportItems = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items array is required for bulk import." });
    }

    const result = await stockModel.bulkImportItems(req.db, items, userId);
    return res.json({
      success: true,
      message: `Bulk import completed. Successfully imported ${result.successCount} of ${result.totalProcessed} items.`,
      data: result,
    });
  } catch (error) {
    console.error("bulkImportItems error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Item by Barcode or Code
const getItemByBarcode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: "Code parameter is required." });
    }
    const item = await stockModel.getItemByCodeOrBarcode(req.db, code);
    if (!item) {
      return res.status(404).json({ success: false, notFound: true, message: `Item with barcode "${code}" not found.` });
    }
    return res.json({ success: true, data: item });
  } catch (error) {
    console.error("getItemByBarcode error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Quick Stock IN by Barcode / QR Code
const quickScanIn = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { code, quantity = 1, unit_price, reference_type, vendor_name, vendor_invoice, notes } = req.body;
    if (!code || !String(code).trim()) {
      return res.status(400).json({ success: false, message: "Barcode or item code is required." });
    }
    const result = await stockModel.quickScanStockIn(
      req.db,
      {
        code: String(code).trim(),
        quantity: parseInt(quantity, 10) || 1,
        unit_price,
        reference_type,
        vendor_name,
        vendor_invoice,
        notes,
      },
      userId
    );

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        notFound: true,
        message: `Stock item with barcode/code "${code}" not found in inventory.`,
        code: result.code,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully added +${result.quantity} ${result.item.unit || "unit"} to ${result.item.name}.`,
      data: result,
    });
  } catch (error) {
    console.error("quickScanIn error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCategories,
  getItems,
  getItemById,
  getItemByBarcode,
  quickScanIn,
  createItem,
  updateItem,
  deleteItem,
  bulkDeleteItems,
  createTransaction,
  getTransactions,
  getAlerts,
  resolveAlert,
  getStockReport,
  bulkImportItems,
};

