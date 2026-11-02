const rateLimit = require('express-rate-limit');

const make = (windowMinutes, limit, message, extra = {}) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    ...extra,
  });

// Đăng nhập: 10 lần sai / 15 phút / IP (đăng nhập đúng không bị tính)
const loginLimiter = make(15, 10, 'Bạn đã thử đăng nhập quá nhiều lần, vui lòng thử lại sau 15 phút.', {
  skipSuccessfulRequests: true,
});
const registerLimiter = make(60, 10, 'Bạn đã đăng ký quá nhiều lần, vui lòng thử lại sau.');
const verifyOtpLimiter = make(15, 10, 'Bạn đã nhập sai OTP quá nhiều lần, vui lòng thử lại sau 15 phút.');
const resendOtpLimiter = make(10, 3, 'Bạn yêu cầu gửi lại OTP quá nhiều lần, vui lòng thử lại sau.');
const passwordResetLimiter = make(15, 5, 'Bạn yêu cầu đặt lại mật khẩu quá nhiều lần, vui lòng thử lại sau 15 phút.');

module.exports = { loginLimiter, registerLimiter, verifyOtpLimiter, resendOtpLimiter, passwordResetLimiter };
