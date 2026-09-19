const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
} = require("../controllers/customFieldController");

router.get("/",        verifyToken, getCustomFields);
router.post("/",       verifyToken, authorizeRoles(1), createCustomField);
router.put("/:id",     verifyToken, authorizeRoles(1), updateCustomField);
router.delete("/:id",  verifyToken, authorizeRoles(1), deleteCustomField);

module.exports = router;
