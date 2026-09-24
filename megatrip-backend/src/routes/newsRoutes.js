const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/newsController');
const { protect, adminOnly } = require('../middleware/auth');

// public
router.get('/slug/:slug', ctrl.getNewsBySlug);
// admin (khớp path /api/admin/news mà frontend đang gọi)
router.get('/', ctrl.listNews);
router.get('/:id', ctrl.getNewsById);
router.post('/', protect, adminOnly, ctrl.createNews);
router.put('/:id', protect, adminOnly, ctrl.updateNews);
router.delete('/:id', protect, adminOnly, ctrl.deleteNews);

module.exports = router;
