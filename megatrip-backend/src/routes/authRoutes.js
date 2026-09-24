const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/verify-otp', ctrl.verifyOtp);
router.post('/resend-otp', ctrl.resendOtp);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

router.get('/me', protect, ctrl.getMe);
router.put('/me', protect, ctrl.updateMe);
router.put('/me/password', protect, ctrl.changePassword);

// Admin - quản lý user
router.get('/users', protect, adminOnly, ctrl.listUsers);
router.get('/user/:id', protect, adminOnly, ctrl.getUserById);
router.post('/admin/user', protect, adminOnly, ctrl.adminCreateUser);
router.put('/admin/user/:id', protect, adminOnly, ctrl.adminUpdateUser);
router.delete('/admin/user/:id', protect, adminOnly, ctrl.adminDeleteUser);

module.exports = router;
