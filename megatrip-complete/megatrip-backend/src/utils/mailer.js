const nodemailer = require('nodemailer');

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, html }) => {
  // Nếu chưa cấu hình SMTP, chỉ log ra console (dev mode) thay vì crash
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[MAIL:DEV] to=${to} subject=${subject}\n${html}`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

module.exports = { sendMail, generateOtp };
