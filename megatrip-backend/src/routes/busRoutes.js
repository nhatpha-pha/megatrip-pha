const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/busController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', ctrl.listBuses);
router.get('/bus-slots/:id', ctrl.getBusSlots);
router.get('/:id', ctrl.getBusById);
router.post('/', protect, adminOnly, ctrl.createBus);
router.put('/:id', protect, adminOnly, ctrl.updateBus);
router.delete('/:id', protect, adminOnly, ctrl.deleteBus);

module.exports = router;
