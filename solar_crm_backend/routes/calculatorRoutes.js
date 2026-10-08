const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const {
  runCalculation,
  saveCalculation,
  getCalculations,
  getCalculationById,
} = require("../controllers/calculatorController");

// Run calculation algorithm (Can be public or logged-in)
router.post("/calculate", runCalculation);

// Save calculation to tenant DB
router.post("/save", verifyToken, saveCalculation);

// List saved calculations
router.get("/", verifyToken, getCalculations);

// Get single calculation by ID
router.get("/:id", verifyToken, getCalculationById);

module.exports = router;
