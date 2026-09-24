const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supportController');
const { protect } = require('../middleware/auth');

router.get('/:id', protect, ctrl.getTicketById);
router.post('/:id/responses', protect, ctrl.addTicketResponse);

module.exports = router;
