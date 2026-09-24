const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, ctrl.listOrders);
router.get('/stats/by-customers', protect, adminOnly, ctrl.statsByCustomers);
router.get('/customer/:customerId', protect, ctrl.getOrdersByCustomer);
router.get('/:id/details', protect, ctrl.getOrderDetails);
router.get('/:id/client/details', protect, ctrl.getOrderDetails);
router.put('/:id/change-calendar', protect, ctrl.changeOrderCalendar);
router.get('/:id', protect, ctrl.getOrderById);
router.post('/', ctrl.createOrder);
router.put('/:id', protect, ctrl.updateOrder);
router.delete('/:id', protect, adminOnly, ctrl.deleteOrder);

module.exports = router;
