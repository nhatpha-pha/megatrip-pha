const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');

// GET /api/reviews
const listReviews = asyncHandler(async (req, res) => {
  const { page = 1, isVisible, rating } = req.query;
  const pageSize = req.query.pageSize || req.query.limit || 10; // frontend admin gửi 'limit'
  const filter = {};
  if (isVisible !== undefined) filter.isVisible = isVisible === 'true';
  if (rating) filter.rating = Number(rating);
  const total = await Review.countDocuments(filter);
  const data = await Review.find(filter)
    .populate('customerId', 'name email avatar')
    .populate('orderId', 'orderNumber customerName')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  res.json({ data, total, pagination: { total, current: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/reviews/product/:productId
const listReviewsByProduct = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId, isVisible: true })
    .populate('customerId', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ data: reviews });
});

// POST /api/reviews
const createReview = asyncHandler(async (req, res) => {
  const review = await Review.create(req.body);
  res.status(201).json({ data: review });
});

// PUT /api/reviews/:id
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!review) {
    res.status(404);
    throw new Error('Không tìm thấy đánh giá');
  }
  res.json({ data: review });
});

// DELETE /api/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Không tìm thấy đánh giá');
  }
  res.json({ data: { message: 'Đã xoá đánh giá' } });
});

// PATCH /api/reviews/:id/toggle-visibility  (admin ẩn/hiện đánh giá)
const toggleVisibility = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Không tìm thấy đánh giá'); }
  review.isVisible = !review.isVisible;
  await review.save();
  res.json({ data: review });
});

module.exports = {
  toggleVisibility, listReviews, listReviewsByProduct, createReview, updateReview, deleteReview };
