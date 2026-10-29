const express = require('express');
const { chatWithOpenAI } = require('../controllers/chatController');

const router = express.Router();

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Gửi câu hỏi tới trợ lý AI MegaTrip
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prompt]
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: Hãy tư vấn tour dựa trên dữ liệu sau...
 *     responses:
 *       200:
 *         description: Câu trả lời của AI
 *       400:
 *         description: Thiếu prompt
 *       503:
 *         description: Chưa cấu hình API key
 */
router.post('/', chatWithOpenAI);

module.exports = router;
