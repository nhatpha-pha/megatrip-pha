const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/busController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * /api/buses:
 *   get:
 *     tags: [Buses]
 *     summary: Danh sách chuyến xe
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Danh sách chuyến xe }
 *   post:
 *     tags: [Buses]
 *     summary: "[Admin] Tạo chuyến xe"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Bus' }
 *     responses:
 *       201: { description: Đã tạo }
 */
router.get('/', ctrl.listBuses);
router.post('/', protect, adminOnly, ctrl.createBus);

/**
 * @swagger
 * /api/buses/bus-slots/{id}:
 *   get:
 *     tags: [Buses]
 *     summary: Sơ đồ ghế theo ngày của 1 chuyến xe
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Danh sách slot/ghế }
 */
router.get('/bus-slots/:id', ctrl.getBusSlots);

/**
 * @swagger
 * /api/buses/{id}:
 *   get:
 *     tags: [Buses]
 *     summary: Chi tiết chuyến xe
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chi tiết chuyến xe }
 *   put:
 *     tags: [Buses]
 *     summary: "[Admin] Cập nhật chuyến xe"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã cập nhật }
 *   delete:
 *     tags: [Buses]
 *     summary: "[Admin] Xoá chuyến xe"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã xoá }
 */
router.get('/:id', ctrl.getBusById);
router.put('/:id', protect, adminOnly, ctrl.updateBus);
router.delete('/:id', protect, adminOnly, ctrl.deleteBus);

module.exports = router;
