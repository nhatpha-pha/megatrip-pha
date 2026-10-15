const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supportController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/support:
 *   get:
 *     tags: [Support]
 *     summary: Danh sách ticket hỗ trợ
 *     responses:
 *       200: { description: Danh sách ticket }
 *   post:
 *     tags: [Support]
 *     summary: Tạo ticket hỗ trợ mới
 *     security: []
 *     responses:
 *       201: { description: Đã tạo ticket }
 */
router.get('/', protect, ctrl.listTickets);
router.post('/', ctrl.createTicket);

/**
 * @swagger
 * /api/support/send-response-email:
 *   post:
 *     tags: [Support]
 *     summary: "[Admin] Gửi email phản hồi ticket cho khách"
 *     responses:
 *       200: { description: Đã gửi email }
 */
router.post('/send-response-email', ctrl.sendResponseEmail);

/**
 * @swagger
 * /api/support/{id}:
 *   get:
 *     tags: [Support]
 *     summary: Chi tiết ticket (gồm phản hồi)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Chi tiết ticket }
 *   put:
 *     tags: [Support]
 *     summary: Cập nhật ticket
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Đã cập nhật }
 *   delete:
 *     tags: [Support]
 *     summary: Xoá ticket
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Đã xoá }
 */
router.get('/:id', ctrl.getTicketById);
router.put('/:id', ctrl.updateTicket);
router.delete('/:id', protect, ctrl.deleteTicket);

/**
 * @swagger
 * /api/support/{id}/messages:
 *   post:
 *     tags: [Support]
 *     summary: Gửi phản hồi vào ticket
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: Đã thêm phản hồi }
 */
router.post('/:id/messages', ctrl.addTicketResponse);

module.exports = router;
