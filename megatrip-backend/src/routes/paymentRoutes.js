const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * /vnpay/create_payment_url:
 *   post:
 *     tags: [Payments]
 *     summary: Tạo link thanh toán VNPay
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               orderId: { type: string }
 *               amount: { type: number }
 *               orderInfo: { type: string }
 *               bankCode: { type: string }
 *     responses:
 *       200: { description: Trả về paymentUrl để redirect người dùng }
 */
router.post('/vnpay/create_payment_url', protect, ctrl.vnpayCreatePaymentUrl);

/**
 * @swagger
 * /vnpay/check-payment:
 *   get:
 *     tags: [Payments]
 *     summary: VNPay redirect về sau khi thanh toán, xác thực chữ ký + cập nhật đơn hàng
 *     security: []
 *     responses:
 *       200: { description: Kết quả xác thực thanh toán }
 */
router.get('/vnpay/check-payment', ctrl.vnpayReturn);
router.get('/vnpay/return', ctrl.vnpayReturn);

/**
 * @swagger
 * /momo/payment:
 *   post:
 *     tags: [Payments]
 *     summary: Tạo thanh toán MoMo
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               orderId: { type: string }
 *               amount: { type: number }
 *               orderInfo: { type: string }
 *     responses:
 *       200: { description: Trả về link thanh toán MoMo }
 */
router.post('/momo/payment', protect, ctrl.momoCreatePayment);
router.post('/momo/ipn', ctrl.momoIpn);

/**
 * @swagger
 * /zalo/payment:
 *   post:
 *     tags: [Payments]
 *     summary: Tạo thanh toán ZaloPay
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               orderId: { type: string }
 *               amount: { type: number }
 *               orderInfo: { type: string }
 *     responses:
 *       200: { description: Trả về link thanh toán ZaloPay }
 */
router.post('/zalo/payment', protect, ctrl.zalopayCreatePayment);
router.post('/zalo/callback', ctrl.zalopayCallback);

/**
 * @swagger
 * /momo/refund:
 *   post:
 *     tags: [Payments]
 *     summary: "[Admin] Hoàn tiền qua MoMo"
 *     security: []
 *     responses:
 *       200: { description: Kết quả hoàn tiền từ MoMo }
 */
router.post('/momo/refund', protect, adminOnly, ctrl.momoRefund);

/**
 * @swagger
 * /zalo/refund:
 *   post:
 *     tags: [Payments]
 *     summary: "[Admin] Hoàn tiền qua ZaloPay"
 *     security: []
 *     responses:
 *       200: { description: Kết quả hoàn tiền từ ZaloPay }
 */
router.post('/zalo/refund', protect, adminOnly, ctrl.zalopayRefund);

module.exports = router;
