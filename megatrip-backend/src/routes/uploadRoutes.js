const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadImages } = require('../controllers/uploadController');

/**
 * @swagger
 * /api/upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload ảnh (lưu trên Cloudinary, trả về URL)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url: { type: string }
 *                       secure_url: { type: string }
 *       400: { description: Thiếu file hoặc sai định dạng }
 */
router.post('/', upload.array('images', 10), uploadImages);

module.exports = router;
