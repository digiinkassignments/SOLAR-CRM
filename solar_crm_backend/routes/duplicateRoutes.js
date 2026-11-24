const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const controller = require('../controllers/duplicateController');
router.use(verifyToken);
router.use((req, res, next) => {
  if (
    req.clientInfo?.id &&
    req.user.client_id &&
    Number(req.clientInfo.id) !== Number(req.user.client_id)
  )
    return res.status(403).json({ success: false, message: 'Sign in to this company again.' });
  next();
});
router.get('/check', controller.search);
router.get('/report', authorizeRoles(1), controller.report);
router.post('/merge', authorizeRoles(1), controller.merge);
module.exports = router;
