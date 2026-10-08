const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/statsController');
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
router.get('/dashboard', ctrl.getDashboardStats);

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
router.get('/revenue', ctrl.getRevenueStats);

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
router.get('/products', ctrl.getProductStats);

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
router.get('/activities', ctrl.getActivities);

module.exports = router;
