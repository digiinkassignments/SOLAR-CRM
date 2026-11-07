const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewController');

// ── Public Routes for Customer Review (No Auth Token Required) ──
router.get('/:tokenOrId', ctrl.getPublicReviewData);
router.post('/:tokenOrId', ctrl.submitPublicReview);

module.exports = router;
