const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/newsController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * /api/admin/news/slug/{slug}:
 *   get:
 *     tags: [News]
 *     summary: Chi tiết bài viết theo slug (public, chỉ bài đã published)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chi tiết bài viết }
 */
router.get('/slug/:slug', ctrl.getNewsBySlug);

/**
 * @swagger
 * /api/admin/news:
 *   get:
 *     tags: [News]
 *     summary: Danh sách bài viết
 *     security: []
 *     responses:
 *       200: { description: Danh sách bài viết }
 *   post:
 *     tags: [News]
 *     summary: "[Admin] Tạo bài viết mới"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               status: { type: string, enum: [draft, scheduled, published, archived] }
 *     responses:
 *       201: { description: Đã tạo bài viết }
 */
router.get('/', ctrl.listNews);
router.post('/', protect, adminOnly, ctrl.createNews);

/**
 * @swagger
 * /api/admin/news/{id}:
 *   get:
 *     tags: [News]
 *     summary: Chi tiết bài viết theo id
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chi tiết bài viết }
 *   put:
 *     tags: [News]
 *     summary: "[Admin] Cập nhật bài viết"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã cập nhật }
 *   delete:
 *     tags: [News]
 *     summary: "[Admin] Xoá bài viết"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã xoá }
 */
router.get('/:id', ctrl.getNewsById);
router.put('/:id', protect, adminOnly, ctrl.updateNews);
router.delete('/:id', protect, adminOnly, ctrl.deleteNews);

module.exports = router;
