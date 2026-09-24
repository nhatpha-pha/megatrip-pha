const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }
  if (!token) {
    res.status(401);
    throw new Error('Chưa đăng nhập / thiếu token');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('Người dùng không tồn tại');
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Token không hợp lệ hoặc đã hết hạn');
  }
});

const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    return next();
  }
  res.status(403);
  throw new Error('Chỉ admin mới được phép thực hiện thao tác này');
};

module.exports = { protect, adminOnly };
