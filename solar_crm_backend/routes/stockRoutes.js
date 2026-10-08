const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { uploadStock, processStockImage } = require("../middleware/uploadMiddleware");

const {
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
} = require("../controllers/stockController");

// All stock routes are protected for Admin only (role_id 1)
router.use(verifyToken);
router.use(authorizeRoles(1));

// Categories & Reports
router.get("/categories", getCategories);
router.get("/report", getStockReport);

// Barcode & QR Quick Scan Operations
router.get("/items/barcode/:code", getItemByBarcode);
router.post("/quick-scan-in", quickScanIn);

// Transactions
router.get("/transactions", getTransactions);
router.post("/transactions", createTransaction);

// Alerts
router.get("/alerts", getAlerts);
router.put("/alerts/:id/resolve", resolveAlert);

// Stock Items CRUD & Bulk Import
router.get("/items", getItems);
router.post("/items/bulk-import", bulkImportItems);
router.post("/items/bulk-delete", bulkDeleteItems);
router.get("/items/:id", getItemById);
router.post("/items", uploadStock.single("image"), processStockImage, createItem);
router.put("/items/:id", uploadStock.single("image"), processStockImage, updateItem);
router.delete("/items/:id", deleteItem);

module.exports = router;

