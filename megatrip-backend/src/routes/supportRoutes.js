const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supportController');
const { protect } = require('../middleware/auth');

router.get('/', protect, ctrl.listTickets);
router.post('/', protect, ctrl.createTicket);
router.put('/:id', protect, ctrl.updateTicket);
router.delete('/:id', protect, ctrl.deleteTicket);

module.exports = router;
