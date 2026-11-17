const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/warrantyController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { clientDbMiddleware } = require('../middleware/clientDbMiddleware');

router.use(authMiddleware, clientDbMiddleware);
router.use((req, res, next) => {
  if (![1, 2].includes(Number(req.user?.role_id))) return res.sendStatus(403);
  if (req.clientInfo?.id && req.user?.client_id && Number(req.user.client_id) !== Number(req.clientInfo.id)) return res.status(403).json({ message: 'Sign in to this company again.' });
  next();
});

router.get('/', ctrl.get);
router.post('/', ctrl.createOrUpdate);
router.put('/', ctrl.createOrUpdate);
router.post('/visits', ctrl.addVisit);
router.put('/visits/:visitId', ctrl.updateVisit);

module.exports = router;
