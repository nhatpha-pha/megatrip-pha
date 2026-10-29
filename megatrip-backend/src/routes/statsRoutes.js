const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/statsController');
const { protect, adminOnly } = require('../middleware/auth');
/**
 * @swagger
 * /api/stats/dashboard:
 *   get:
 *     tags: [Stats]
 *     summary: "[Admin] Tổng quan dashboard (doanh thu, số đơn, số dịch vụ)"
 *     parameters:
 *       - in: query
 *         name: start
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: end
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: Thống kê tổng quan (trả thẳng, không bọc trong data) }
 */
router.get('/dashboard', protect, adminOnly, ctrl.getDashboardStats);

/**
 * @swagger
 * /api/stats/revenue:
 *   get:
 *     tags: [Stats]
 *     summary: "[Admin] Doanh thu theo thời gian + theo loại dịch vụ"
 *     parameters:
 *       - in: query
 *         name: start
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: end
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: revenueOverTime + revenueByType }
 */
router.get('/revenue', protect, adminOnly, ctrl.getRevenueStats);

/**
 * @swagger
 * /api/stats/products:
 *   get:
 *     tags: [Stats]
 *     summary: "[Admin] Top sản phẩm/dịch vụ bán chạy"
 *     parameters:
 *       - in: query
 *         name: start
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: end
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: topBookedProducts }
 */
router.get('/products', protect, adminOnly, ctrl.getProductStats);

/**
 * @swagger
 * /api/stats/activities:
 *   get:
 *     tags: [Stats]
 *     summary: "[Admin] Hoạt động gần đây (đơn hàng mới, huỷ...)"
 *     parameters:
 *       - in: query
 *         name: start
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: end
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: Danh sách hoạt động gần đây }
 */
router.get('/activities', protect, adminOnly, ctrl.getActivities);

module.exports = router;
