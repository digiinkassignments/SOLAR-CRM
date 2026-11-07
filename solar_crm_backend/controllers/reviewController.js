const handoverModel = require('../models/handoverModel');

// GET /api/public/review/:tokenOrId
exports.getPublicReviewData = async (req, res) => {
  try {
    const { tokenOrId } = req.params;
    if (!tokenOrId) {
      return res.status(400).json({ success: false, message: 'Review token or project ID is required.' });
    }

    const reviewData = await handoverModel.getPublicHandoverReview(req.db, tokenOrId);
    if (!reviewData) {
      return res.status(404).json({ success: false, message: 'Project or review link not found.' });
    }

    return res.status(200).json({
      success: true,
      data: reviewData,
    });
  } catch (err) {
    console.error('getPublicReviewData error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load review page.', error: err.message });
  }
};

// POST /api/public/review/:tokenOrId
exports.submitPublicReview = async (req, res) => {
  try {
    const { tokenOrId } = req.params;
    const { rating, feedback, reviewer_name } = req.body;

    if (!tokenOrId) {
      return res.status(400).json({ success: false, message: 'Review token or project ID is required.' });
    }

    if (!rating || isNaN(rating) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid star rating between 1 and 5.' });
    }

    const updatedReview = await handoverModel.submitPublicHandoverReview(req.db, tokenOrId, {
      rating,
      feedback,
      reviewer_name,
    });

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your solar handover review has been successfully submitted.',
      data: updatedReview,
    });
  } catch (err) {
    console.error('submitPublicReview error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to submit review.' });
  }
};
