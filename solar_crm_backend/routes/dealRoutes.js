const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  closeOrderHandler,
  getOrderByLeadHandler,
} = require("../controllers/dealController");

// ── Deal Won & Order Routes ──
router.post("/close-order", verifyToken, closeOrderHandler);
router.get("/order/:leadId", verifyToken, getOrderByLeadHandler);

module.exports = router;
