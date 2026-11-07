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

// Protected by JWT
router.use(verifyToken);

// Read-only stock catalog accessible by all authenticated staff (for Daily Site Logs, BOM, Inspections)
router.get("/categories", getCategories);
router.get("/items", getItems);
router.get("/items/:id", getItemById);
router.get("/items/barcode/:code", getItemByBarcode);

// All mutating or sensitive operations restricted to Admin (role 1) and authorized managers
router.use(authorizeRoles(1, 2));

// Reports
router.get("/report", getStockReport);

// Barcode & QR Quick Scan Operations
router.post("/quick-scan-in", quickScanIn);

// Transactions
router.get("/transactions", getTransactions);
router.post("/transactions", createTransaction);

// Alerts
router.get("/alerts", getAlerts);
router.put("/alerts/:id/resolve", resolveAlert);

// Stock Items CRUD & Bulk Import
router.post("/items/bulk-import", bulkImportItems);
router.post("/items/bulk-delete", bulkDeleteItems);
router.post("/items", uploadStock.single("image"), processStockImage, createItem);
router.put("/items/:id", uploadStock.single("image"), processStockImage, updateItem);
router.delete("/items/:id", deleteItem);

module.exports = router;

