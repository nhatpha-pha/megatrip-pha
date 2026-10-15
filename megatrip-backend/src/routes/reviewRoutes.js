const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: "[Admin] Danh sách đánh giá"
 *     responses:
 *       200: { description: Danh sách đánh giá }
 *   post:
 *     tags: [Reviews]
 *     summary: Gửi đánh giá mới
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               orderId: { type: string }
 *               productId: { type: string }
 *               productType: { type: string, enum: [tour, bus, flight] }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Đã gửi đánh giá }
 */
router.get('/', protect, adminOnly, ctrl.listReviews);
router.post('/', protect, ctrl.createReview);

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Danh sách đánh giá của 1 sản phẩm (public)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Danh sách đánh giá }
 */
router.get('/product/:productId', ctrl.listReviewsByProduct);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: "[Admin] Cập nhật đánh giá (ẩn/hiện...)"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã cập nhật }
 *   delete:
 *     tags: [Reviews]
 *     summary: "[Admin] Xoá đánh giá"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã xoá }
 */

/**
 * @swagger
 * /api/reviews/{id}/toggle-visibility:
 *   patch:
 *     tags: [Reviews]
 *     summary: "[Admin] Ẩn/hiện đánh giá"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Đã đổi trạng thái hiển thị }
 */
router.patch('/:id/toggle-visibility', protect, adminOnly, ctrl.toggleVisibility);
router.put('/:id', protect, adminOnly, ctrl.updateReview);
router.delete('/:id', protect, adminOnly, ctrl.deleteReview);

module.exports = router;
