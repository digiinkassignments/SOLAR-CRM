const express = require("express");
const router = express.Router();
const procurementController = require("../controllers/procurementController");

const { verifyToken } = require("../middleware/authMiddleware");
const { clientDbMiddleware } = require("../config/clientDb");

// Middleware aliases
const authMiddleware = verifyToken;

// ── PROTECTED CRM ROUTES (All procurement endpoints require auth & client DB injection) ──
router.use(authMiddleware);
if (typeof clientDbMiddleware === "function") {
  router.use(clientDbMiddleware);
}

// ── PROCUREMENT / PURCHASE ORDERS ROUTES ──
router.get("/", procurementController.getAllPurchaseOrders);
router.get("/stats", procurementController.getProcurementStats);
router.get("/:id", procurementController.getPurchaseOrderById);
router.post("/", procurementController.createPurchaseOrder);
router.put("/:id/status", procurementController.updatePOStatus);
router.put("/:id", procurementController.updatePurchaseOrder);
router.delete("/:id", procurementController.deletePurchaseOrder);

module.exports = router;
