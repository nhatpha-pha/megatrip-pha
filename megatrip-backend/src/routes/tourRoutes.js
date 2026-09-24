const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tourController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', ctrl.listTours);
router.get('/slug/:slug', ctrl.getTourBySlug);
router.get('/:id/slots', ctrl.getTourSlots);
router.post('/:id/slots', protect, adminOnly, ctrl.addTourSlot);
router.get('/:id', ctrl.getTourById);
router.post('/', protect, adminOnly, ctrl.createTour);
router.put('/:id', protect, adminOnly, ctrl.updateTour);
router.delete('/:id', protect, adminOnly, ctrl.deleteTour);

module.exports = router;
