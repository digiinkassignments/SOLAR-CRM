const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/warrantyController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { clientDbMiddleware } = require('../middleware/clientDbMiddleware');

router.use(authMiddleware, clientDbMiddleware);

router.get('/', ctrl.get);
router.post('/', ctrl.createOrUpdate);
router.put('/', ctrl.createOrUpdate);
router.post('/visits', ctrl.addVisit);

module.exports = router;
