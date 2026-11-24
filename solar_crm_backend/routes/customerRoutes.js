const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { clientDbMiddleware } = require('../config/clientDb');

const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  convertCustomerToProject,
} = require('../controllers/customerController');

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

// ── PROTECTED CRM ROUTES ──
router.use(verifyToken);
if (typeof clientDbMiddleware === 'function') {
  router.use(clientDbMiddleware);
}

router.use((req, res, next) => {
  if (
    req.clientInfo?.id &&
    req.user?.client_id &&
    Number(req.clientInfo.id) !== Number(req.user.client_id)
  )
    return res.status(403).json({ success: false, message: 'Sign in to this company again.' });
  next();
});
const recycle = require('../controllers/customerDeletionController');
router.get('/recycle-bin', authorizeRoles(1, 2), recycle.list);
router.post('/:id/restore', authorizeRoles(1, 2), recycle.restore);
router.get('/:id/delete-preview', authorizeRoles(1, 2), recycle.preview);
router.get('/:id/export', recycle.export);
router.use(require('./customerWorkspaceRoutes'));

// 1. View Customers List & 360 Profile (Admin, Manager & Sales)
router.get('/', authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), getCustomers);
router.get('/:id', authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), getCustomerById);

// 2. Create / Update Customer (Admin & Manager)
router.post('/', authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), createCustomer);
router.put('/:id', authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), updateCustomer);
router.post('/:id/convert-to-project', authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), convertCustomerToProject);

// 3. Delete Customer (Super Admin only)
router.delete('/:id', authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), recycle.archive);

module.exports = router;
