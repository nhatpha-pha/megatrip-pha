const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const { rateLimit } = require('../middleware/security');
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 8, message: 'Quá nhiều lần thử đăng nhập, vui lòng chờ một phút.' });
const otpLimiter = rateLimit({ windowMs: 60 * 1000, max: 6, message: 'Quá nhiều lần thử OTP, vui lòng chờ một phút.' });

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng ký tài khoản (gửi OTP qua email)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: Đăng ký thành công }
 *       400: { description: Email đã tồn tại }
 */
router.post('/register', authLimiter, ctrl.register);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Xác thực mã OTP sau khi đăng ký
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string }
 *               code: { type: string }
 *     responses:
 *       200: { description: Xác thực thành công }
 */
router.post('/verify-otp', otpLimiter, ctrl.verifyOtp);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Gửi lại mã OTP
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Đã gửi lại OTP }
 */
router.post('/resend-otp', authLimiter, ctrl.resendOtp);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập, trả về accessToken + refreshToken
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *                     user: { $ref: '#/components/schemas/User' }
 *       401: { description: Sai email hoặc mật khẩu }
 */
router.post('/login', loginLimiter, ctrl.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Gửi token đặt lại mật khẩu qua email
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Đã gửi hướng dẫn (nếu email tồn tại) }
 */
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Đặt lại mật khẩu bằng token
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token, password]
 *             properties:
 *               email: { type: string }
 *               token: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Đặt lại mật khẩu thành công }
 */
router.post('/reset-password', authLimiter, ctrl.resetPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Lấy thông tin tài khoản đang đăng nhập
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/User' }
 *   put:
 *     tags: [Auth]
 *     summary: Cập nhật hồ sơ (name, address, phone, dob)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               dob: { type: string }
 *     responses:
 *       200: { description: Đã cập nhật }
 */
router.get('/me', protect, ctrl.getMe);
router.put('/me', protect, ctrl.updateMe);

/**
 * @swagger
 * /api/auth/me/password:
 *   put:
 *     tags: [Auth]
 *     summary: Đổi mật khẩu
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Đổi mật khẩu thành công }
 */
router.put('/me/password', protect, ctrl.changePassword);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     tags: [Auth]
 *     summary: "[Admin] Danh sách user"
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Danh sách user có phân trang }
 */
router.get('/users', protect, adminOnly, ctrl.listUsers);

/**
 * @swagger
 * /api/auth/user/{id}:
 *   get:
 *     tags: [Auth]
 *     summary: "[Admin] Chi tiết 1 user"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thông tin user }
 *       404: { description: Không tìm thấy }
 */
router.get('/user/:id', protect, adminOnly, ctrl.getUserById);

/**
 * @swagger
 * /api/auth/admin/user:
 *   post:
 *     tags: [Auth]
 *     summary: "[Admin] Tạo user mới"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *               role: { type: string, enum: [customer, admin, staff] }
 *     responses:
 *       201: { description: Đã tạo user }
 */
router.post('/admin/user', protect, adminOnly, ctrl.adminCreateUser);

/**
 * @swagger
 * /api/auth/admin/user/{id}:
 *   put:
 *     tags: [Auth]
 *     summary: "[Admin] Cập nhật user"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã cập nhật }
 *   delete:
 *     tags: [Auth]
 *     summary: "[Admin] Xoá user"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Đã xoá }
 */
router.put('/admin/user/:id', protect, adminOnly, ctrl.adminUpdateUser);
router.delete('/admin/user/:id', protect, adminOnly, ctrl.adminDeleteUser);

module.exports = router;
