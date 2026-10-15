const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/flightTicketController');

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: Danh sách vé máy bay đã đặt (khớp ghế khi đổi lịch bay)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         style: form
 *         explode: true
 *         schema: { type: array, items: { type: string, enum: [pending, paid, changed, cancelled] } }
 *     responses:
 *       200: { description: Danh sách vé }
 */
router.get('/', ctrl.listTickets);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Chi tiết 1 vé máy bay
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chi tiết vé }
 */
router.get('/:id', ctrl.getTicketById);

module.exports = router;
