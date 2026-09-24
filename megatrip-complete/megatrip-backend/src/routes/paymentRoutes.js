const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');

// Khớp với các endpoint frontend đang gọi trực tiếp (không có tiền tố /api):
// PAYMENT_BASE/vnpay/create_payment_url , API_BASE/vnpay/check-payment
// PAYMENT_BASE/momo/payment , PAYMENT_BASE/zalo/payment
router.post('/vnpay/create_payment_url', ctrl.vnpayCreatePaymentUrl);
router.get('/vnpay/check-payment', ctrl.vnpayReturn);
router.get('/vnpay/return', ctrl.vnpayReturn);

router.post('/momo/payment', ctrl.momoCreatePayment);
router.post('/momo/ipn', ctrl.momoIpn);

router.post('/zalo/payment', ctrl.zalopayCreatePayment);
router.post('/zalo/callback', ctrl.zalopayCallback);

module.exports = router;
