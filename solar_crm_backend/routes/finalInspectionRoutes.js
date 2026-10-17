const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/finalInspectionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { clientDbMiddleware } = require('../middleware/clientDbMiddleware');

router.use(authMiddleware, clientDbMiddleware);
router.get('/', ctrl.get);
router.post('/', ctrl.create);
router.put('/', ctrl.update);

module.exports = router;
