const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, ctrl.listReviews);
router.get('/product/:productId', ctrl.listReviewsByProduct);
router.post('/', protect, ctrl.createReview);
router.put('/:id', protect, adminOnly, ctrl.updateReview);
router.delete('/:id', protect, adminOnly, ctrl.deleteReview);

module.exports = router;
