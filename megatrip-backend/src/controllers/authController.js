const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const { sendMail, generateOtp } = require('../utils/mailer');

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Vui lòng nhập email và mật khẩu');
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('Email đã được sử dụng');
  }
  const hashed = await bcrypt.hash(password, 10);
  const otpCode = generateOtp();
  const user = await User.create({
    email: email.toLowerCase(),
    password: hashed,
    otpCode,
    otpExpires: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendMail({
    to: user.email,
    subject: 'MegaTrip - Mã xác thực OTP',
    html: `<p>Mã OTP của bạn là: <b>${otpCode}</b> (hết hạn sau 10 phút)</p>`,
  });

  res.status(201).json({ data: { message: 'Đăng ký thành công, vui lòng kiểm tra email để xác thực OTP', email: user.email } });
});

// @route POST /api/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+otpCode +otpExpires');
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy tài khoản');
  }
  if (user.isVerified) {
    return res.json({ data: { message: 'Tài khoản đã được xác thực trước đó' } });
  }
  if (!user.otpCode || user.otpCode !== code || user.otpExpires < new Date()) {
    res.status(400);
    throw new Error('Mã OTP không đúng hoặc đã hết hạn');
  }
  user.isVerified = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save();
  res.json({ data: { message: 'Xác thực tài khoản thành công' } });
});

// @route POST /api/auth/resend-otp
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy tài khoản');
  }
  if (user.isVerified) {
    return res.json({ data: { message: 'Tài khoản đã được xác thực' } });
  }
  const otpCode = generateOtp();
  user.otpCode = otpCode;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await sendMail({
    to: user.email,
    subject: 'MegaTrip - Mã OTP mới',
    html: `<p>Mã OTP mới của bạn là: <b>${otpCode}</b> (hết hạn sau 10 phút)</p>`,
  });
  res.json({ data: { message: 'Đã gửi lại mã OTP' } });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('Email hoặc mật khẩu không đúng');
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    res.status(401);
    throw new Error('Email hoặc mật khẩu không đúng');
  }
  if (!user.isVerified) {
    res.status(403);
    throw new Error('Tài khoản chưa xác thực OTP');
  }
  if (user.status === 'blocked') {
    res.status(403);
    throw new Error('Tài khoản đã bị khoá');
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  res.json({ data: { accessToken, refreshToken, token: accessToken, user: user.toJSON() } });
});

// @route POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) {
    // không tiết lộ email tồn tại hay không
    return res.json({ data: { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi' } });
  }
  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();
  await sendMail({
    to: user.email,
    subject: 'MegaTrip - Đặt lại mật khẩu',
    html: `<p>Mã token đặt lại mật khẩu: <b>${token}</b> (hết hạn sau 30 phút)</p>`,
  });
  res.json({ data: { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi' } });
});

// @route POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+resetToken +resetTokenExpires');
  if (!user || user.resetToken !== token || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    res.status(400);
    throw new Error('Token không hợp lệ hoặc đã hết hạn');
  }
  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  res.json({ data: { message: 'Đặt lại mật khẩu thành công' } });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ data: req.user.toJSON() });
});

// Lưu tùy chọn thanh toán (phương thức ưa thích + thông tin xuất hóa đơn). Không nhận số thẻ/CVV.
const SAVEABLE_METHODS = ['momo', 'zalopay', 'vnpay', 'cod', 'bank_transfer'];
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const applySavedPayment = (user, input) => {
  const sp = input || {};
  if (sp.clear === true) {
    user.savedPayment = { preferredMethod: '', invoice: { companyName: '', taxCode: '', address: '', email: '' } };
    return;
  }
  const cur = (user.savedPayment && user.savedPayment.toObject ? user.savedPayment.toObject() : user.savedPayment) || {};
  const next = {
    preferredMethod: cur.preferredMethod || '',
    invoice: { companyName: '', taxCode: '', address: '', email: '', ...(cur.invoice || {}) },
  };
  if (sp.preferredMethod !== undefined) {
    next.preferredMethod = SAVEABLE_METHODS.includes(sp.preferredMethod) ? sp.preferredMethod : '';
  }
  if (sp.invoice && typeof sp.invoice === 'object') {
    next.invoice = {
      companyName: clip(sp.invoice.companyName, 150),
      taxCode: clip(sp.invoice.taxCode, 20),
      address: clip(sp.invoice.address, 255),
      email: clip(sp.invoice.email, 120),
    };
  }
  user.savedPayment = next;
};

// @route PUT /api/auth/me  (updateProfile: name, address, phone, dob, savedPayment)
const updateMe = asyncHandler(async (req, res) => {
  const { name, address, phone, dob, savedPayment } = req.body;
  const user = req.user;
  if (name !== undefined) user.name = name;
  if (address !== undefined) user.address = address;
  if (phone !== undefined) user.phone = phone;
  if (dob !== undefined) user.dob = dob;
  if (savedPayment !== undefined) applySavedPayment(user, savedPayment);
  await user.save();
  res.json({ data: user.toJSON() });
});

// @route PUT /api/auth/me/password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) {
    res.status(400);
    throw new Error('Mật khẩu cũ không đúng');
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ data: { message: 'Đổi mật khẩu thành công' } });
});

// ===== Admin: users management =====

// ----- Vai trò: admin giao diện cũ dùng 'user'/'employee', backend dùng 'customer'/'staff' -----
const ROLE_ALIAS = { user: 'customer', employee: 'staff' };
const VALID_ROLES = ['customer', 'admin', 'staff'];
const normRole = (r) => {
  const v = String(r ?? '').trim();
  const mapped = ROLE_ALIAS[v] || v;
  return VALID_ROLES.includes(mapped) ? mapped : null;
};
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Chỉ admin mới được tạo/sửa/xóa tài khoản admin hoặc nhân viên; staff chỉ quản lý khách hàng.
const assertCanManage = (actor, targetRole, res) => {
  if (targetRole !== 'customer' && (!actor || actor.role !== 'admin')) {
    res.status(403);
    throw new Error('Chỉ admin mới được quản lý tài khoản admin/nhân viên');
  }
};

// @route GET /api/auth/users?role=customer|admin,employee&q=...&page=1&limit=10
const listUsers = asyncHandler(async (req, res) => {
  const { search = '', q = '', role, status } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || req.query.limit) || 10, 1), 200);
  const filter = {};
  const keyword = String(search || q || '').trim();
  if (keyword) {
    const rx = escapeRegex(keyword);
    filter.$or = [{ name: { $regex: rx, $options: 'i' } }, { email: { $regex: rx, $options: 'i' } }, { phone: { $regex: rx, $options: 'i' } }];
  }
  if (role) {
    const roles = String(role).split(',').map(normRole).filter(Boolean);
    filter.role = { $in: roles.length ? roles : ['__none__'] };
  }
  if (status) filter.status = status;

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  res.json({
    data: { users: users.map((u) => u.toJSON()), total, page, limit: pageSize },
    pagination: { total, current: page, pageSize },
  });
});

// @route GET /api/auth/user/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
  res.json({ data: user.toJSON() });
});

// @route POST /api/auth/admin/user
const adminCreateUser = asyncHandler(async (req, res) => {
  const { email, password, name, phone, address, status, isVerified } = req.body;
  const role = normRole(req.body.role ?? 'customer');
  if (!role) {
    res.status(400);
    throw new Error('Vai trò không hợp lệ (customer, staff hoặc admin)');
  }
  assertCanManage(req.user, role, res);
  const mail = String(email || '').trim().toLowerCase();
  if (!mail || !/^\S+@\S+\.\S+$/.test(mail)) {
    res.status(400);
    throw new Error('Email không hợp lệ');
  }
  if (password && String(password).length < 6) {
    res.status(400);
    throw new Error('Mật khẩu tối thiểu 6 ký tự');
  }
  const existing = await User.findOne({ email: mail });
  if (existing) {
    res.status(400);
    throw new Error('Email đã tồn tại');
  }
  const hashed = await bcrypt.hash(password || '123456', 10);
  const user = await User.create({
    email: mail,
    password: hashed,
    name: name || '',
    phone: phone || '',
    address: address || '',
    role,
    status: status === 'blocked' ? 'blocked' : 'active',
    isVerified: isVerified === undefined ? true : !!isVerified,
  });
  res.status(201).json({ data: user.toJSON() });
});

// @route PUT /api/auth/admin/user/:id
const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
  assertCanManage(req.user, user.role, res);
  const { name, phone, address, status, email, password, isVerified } = req.body;
  if (req.body.role !== undefined) {
    const role = normRole(req.body.role);
    if (!role) {
      res.status(400);
      throw new Error('Vai trò không hợp lệ (customer, staff hoặc admin)');
    }
    assertCanManage(req.user, role, res);
    user.role = role;
  }
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (status !== undefined) user.status = status === 'blocked' ? 'blocked' : 'active';
  if (isVerified !== undefined) user.isVerified = !!isVerified;
  if (email !== undefined) {
    const mail = String(email).trim().toLowerCase();
    const dup = await User.findOne({ email: mail, _id: { $ne: user._id } });
    if (dup) {
      res.status(400);
      throw new Error('Email đã tồn tại');
    }
    user.email = mail;
  }
  if (password) {
    if (String(password).length < 6) {
      res.status(400);
      throw new Error('Mật khẩu tối thiểu 6 ký tự');
    }
    user.password = await bcrypt.hash(String(password), 10);
  }
  await user.save();
  res.json({ data: user.toJSON() });
});

// @route DELETE /api/auth/admin/user/:id
const adminDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
  assertCanManage(req.user, user.role, res);
  if (String(user._id) === String(req.user._id)) {
    res.status(400);
    throw new Error('Không thể tự xoá tài khoản của chính mình');
  }
  await user.deleteOne();
  res.json({ data: { message: 'Đã xoá người dùng' } });
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  changePassword,
  listUsers,
  getUserById,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
};
