const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tourController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * /api/tours:
 *   get:
 *     tags: [Tours]
 *     summary: Danh sách tour (có phân trang, filter)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: Danh sách tour }
 *   post:
 *     tags: [Tours]
 *     summary: "[Admin] Tạo tour mới"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Tour' }
 *     responses:
 *       201: { description: Đã tạo tour }
 */
router.get('/', ctrl.listTours);
router.post('/', protect, adminOnly, ctrl.createTour);

/**
 * @swagger
 * /api/tours/batch:
 *   post:
 *     tags: [Tours]
 *     summary: Lấy nhiều tour theo danh sách slug (giữ thứ tự, null nếu không có)
 *     security: []
 *     responses:
 *       200: { description: Mảng tour }
 */
router.post('/batch', ctrl.getToursBatch);

/**
 * @swagger
 * /api/tours/slug/{slug}:
 *   get:
 *     tags: [Tours]
 *     summary: Chi tiết tour theo slug
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chi tiết tour }
 *       404: { description: Không tìm thấy }
 */
router.get('/slug/:slug', ctrl.getTourBySlug);

/**
 * @swagger
 * /api/tours/{id}/slots:
 *   get:
 *     tags: [Tours]
 *     summary: Danh sách slot ngày khởi hành của tour
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Danh sách slot }
 *   post:
 *     tags: [Tours]
 *     summary: "[Admin] Thêm slot ngày khởi hành"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Đã thêm slot }
 */
router.get('/:id/slots', ctrl.getTourSlots);
router.post('/:id/slots', protect, adminOnly, ctrl.addTourSlot);

/**
 * @swagger
 * /api/tours/{id}:
 *   get:
 *     tags: [Tours]
 *     summary: Chi tiết tour theo id
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chi tiết tour }
 *   put:
 *     tags: [Tours]
 *     summary: "[Admin] Cập nhật tour"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã cập nhật }
 *   delete:
 *     tags: [Tours]
 *     summary: "[Admin] Xoá tour"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã xoá }
 */
router.get('/:id', ctrl.getTourById);
router.put('/:id', protect, adminOnly, ctrl.updateTour);
router.delete('/:id', protect, adminOnly, ctrl.deleteTour);

module.exports = router;
