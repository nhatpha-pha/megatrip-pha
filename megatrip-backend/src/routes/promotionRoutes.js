const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/promotionController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * /api/promotions:
 *   get:
 *     tags: [Promotions]
 *     summary: Danh sách mã khuyến mãi
 *     security: []
 *     responses:
 *       200: { description: Danh sách mã khuyến mãi }
 *   post:
 *     tags: [Promotions]
 *     summary: "[Admin] Tạo mã khuyến mãi"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Promotion' }
 *     responses:
 *       201: { description: Đã tạo }
 */
router.get('/', ctrl.listPromotions);
router.post('/', protect, adminOnly, ctrl.createPromotion);

/**
 * @swagger
 * /api/promotions/validate:
 *   post:
 *     tags: [Promotions]
 *     summary: Kiểm tra mã khuyến mãi hợp lệ, tính số tiền giảm
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *               appliesTo: { type: string, enum: [tours, flights, buses] }
 *               orderTotal: { type: number }
 *     responses:
 *       200: { description: Mã hợp lệ, kèm discountAmount }
 *       400: { description: Mã không hợp lệ/hết hạn/chưa đạt mức tối thiểu }
 *       404: { description: Mã không tồn tại }
 */
router.post('/validate', ctrl.validatePromotion);

/**
 * @swagger
 * /api/promotions/{id}:
 *   get:
 *     tags: [Promotions]
 *     summary: Chi tiết mã khuyến mãi
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chi tiết }
 *   put:
 *     tags: [Promotions]
 *     summary: "[Admin] Cập nhật mã khuyến mãi"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã cập nhật }
 *   delete:
 *     tags: [Promotions]
 *     summary: "[Admin] Xoá mã khuyến mãi"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã xoá }
 */
router.get('/:id', ctrl.getPromotionById);
router.put('/:id', protect, adminOnly, ctrl.updatePromotion);
router.delete('/:id', protect, adminOnly, ctrl.deletePromotion);

module.exports = router;
