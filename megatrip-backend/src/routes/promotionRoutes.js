const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/promotionController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', ctrl.listPromotions);
router.post('/validate', ctrl.validatePromotion);
router.get('/:id', ctrl.getPromotionById);
router.post('/', protect, adminOnly, ctrl.createPromotion);
router.put('/:id', protect, adminOnly, ctrl.updatePromotion);
router.delete('/:id', protect, adminOnly, ctrl.deletePromotion);

module.exports = router;
