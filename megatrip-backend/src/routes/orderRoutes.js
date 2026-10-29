const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: "[Admin] Danh sách đơn hàng"
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: orderStatus
 *         schema: { type: string }
 *       - in: query
 *         name: paymentStatus
 *         schema: { type: string }
 *     responses:
 *       200: { description: Danh sách đơn hàng }
 *   post:
 *     tags: [Orders]
 *     summary: Tạo đơn hàng mới
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Order' }
 *     responses:
 *       201: { description: Đã tạo đơn hàng }
 */
router.get('/', protect, adminOnly, ctrl.listOrders);
router.post('/', protect, ctrl.createOrder);

/**
 * @swagger
 * /api/orders/stats/by-customers:
 *   get:
 *     tags: [Orders]
 *     summary: "[Admin] Thống kê tổng chi tiêu theo từng khách hàng"
 *     responses:
 *       200: { description: Danh sách thống kê }
 */
router.get('/stats/by-customers', protect, adminOnly, ctrl.statsByCustomers);

/**
 * @swagger
 * /api/orders/customer/{customerId}:
 *   get:
 *     tags: [Orders]
 *     summary: Danh sách đơn hàng của 1 khách hàng
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Danh sách đơn hàng }
 */
router.get('/customer/:customerId', protect, ctrl.getOrdersByCustomer);

/**
 * @swagger
 * /api/orders/{id}/details:
 *   get:
 *     tags: [Orders]
 *     summary: Chi tiết đơn hàng (kèm thông tin khách hàng)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chi tiết đơn hàng }
 */
router.get('/:id/details', protect, ctrl.getOrderDetails);
router.get('/:id/client/details', protect, ctrl.getOrderDetails);

/**
 * @swagger
 * /api/orders/{id}/change-calendar:
 *   put:
 *     tags: [Orders]
 *     summary: Yêu cầu đổi lịch cho đơn hàng
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dateChangeCalendar: { type: string }
 *     responses:
 *       200: { description: Đã cập nhật lịch mới }
 */
router.put('/:id/change-calendar', protect, ctrl.changeOrderCalendar);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Chi tiết đơn hàng theo id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chi tiết đơn hàng }
 *   put:
 *     tags: [Orders]
 *     summary: Cập nhật đơn hàng (trạng thái, ghi chú...)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã cập nhật }
 *   delete:
 *     tags: [Orders]
 *     summary: "[Admin] Xoá đơn hàng"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã xoá }
 */
router.get('/:id', protect, ctrl.getOrderById);
router.put('/:id', protect, ctrl.updateOrder);
router.delete('/:id', protect, adminOnly, ctrl.deleteOrder);

module.exports = router;
