require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();
  const email = (process.env.ADMIN_EMAIL || 'admin@megatrip.vn').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin đã tồn tại: ${email}`);
    process.exit(0);
  }
  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    name: 'Administrator',
    email,
    password: hashed,
    role: 'admin',
    isVerified: true,
  });
  console.log(`Đã tạo tài khoản admin: ${email} / mật khẩu: ${password}`);
  process.exit(0);
})();
