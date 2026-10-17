const express = require('express');
const router = express.Router({ mergeParams: true });
const { getInspection, createInspection, updateInspection } = require('../controllers/inspectionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { clientDbMiddleware } = require('../middleware/clientDbMiddleware');

router.use(authMiddleware, clientDbMiddleware);
router.get('/', getInspection);
router.post('/', createInspection);
router.put('/', updateInspection);

module.exports = router;
