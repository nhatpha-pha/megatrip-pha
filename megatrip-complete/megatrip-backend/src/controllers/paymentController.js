const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const qs = require('qs');
const axios = require('axios');
const Order = require('../models/Order');

// ================= VNPAY =================
// Docs: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

// POST /api/payments/vnpay/create_payment_url  { orderId, amount, orderInfo, bankCode? }
const vnpayCreatePaymentUrl = asyncHandler(async (req, res) => {
  const { orderId, amount, orderInfo = 'Thanh toan don hang MegaTrip', bankCode, ipAddr } = req.body;
  if (!amount) {
    res.status(400);
    throw new Error('Thiếu số tiền thanh toán (amount)');
  }

  const tmnCode = process.env.VNPAY_TMN_CODE;
  const secretKey = process.env.VNPAY_HASH_SECRET;
  const vnpUrl = process.env.VNPAY_URL;
  const returnUrl = process.env.VNPAY_RETURN_URL;

  const date = new Date();
  const createDate = date
    .toISOString()
    .replace(/[-:T.]/g, '')
    .slice(0, 14);
  const txnRef = `${orderId || 'MT'}-${Date.now()}`;

  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(amount) * 100, // VNPay yêu cầu nhân 100
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || req.ip || '127.0.0.1',
    vnp_CreateDate: createDate,
  };
  if (bankCode) vnp_Params.vnp_BankCode = bankCode;

  vnp_Params = sortObject(vnp_Params);
  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params.vnp_SecureHash = signed;

  const paymentUrl = `${vnpUrl}?${qs.stringify(vnp_Params, { encode: false })}`;
  res.json({ paymentUrl, txnRef });
});

// GET /api/payments/vnpay/return  &  /vnpay/check-payment  (VNPay redirect về kèm query string)
const vnpayReturn = asyncHandler(async (req, res) => {
  const vnp_Params = { ...req.query };
  const secureHash = vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  const sorted = sortObject(vnp_Params);
  const signData = qs.stringify(sorted, { encode: false });
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
  const checkSum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const isValid = checkSum === secureHash;
  const isSuccess = isValid && vnp_Params.vnp_ResponseCode === '00';

  // Cập nhật đơn hàng nếu có orderNumber trong query (?orderNumber=...)
  const { orderNumber } = req.query;
  if (orderNumber) {
    const order = await Order.findOne({ orderNumber });
    if (order) {
      order.paymentStatus = isSuccess ? 'paid' : 'failed';
      order.timeline.push({
        status: order.orderStatus,
        note: isSuccess ? 'Thanh toán VNPay thành công' : 'Thanh toán VNPay thất bại',
        actor: 'vnpay',
        timestamp: new Date(),
      });
      await order.save();
    }
  }

  res.json({ isValid, isSuccess, data: vnp_Params });
});

// ================= MOMO =================
// Docs: https://developers.momo.vn/v3/docs/payment/api/wallet/onetime
const momoCreatePayment = asyncHandler(async (req, res) => {
  const { orderId, amount, orderInfo = 'Thanh toan don hang MegaTrip' } = req.body;
  if (!amount) {
    res.status(400);
    throw new Error('Thiếu số tiền thanh toán (amount)');
  }

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const redirectUrl = process.env.MOMO_REDIRECT_URL;
  const ipnUrl = process.env.MOMO_IPN_URL;
  const requestId = `${Date.now()}`;
  const momoOrderId = `${orderId || 'MT'}-${requestId}`;
  const requestType = 'captureWallet';
  const extraData = '';

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  const payload = {
    partnerCode,
    accessKey,
    requestId,
    amount: String(amount),
    orderId: momoOrderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'vi',
  };

  try {
    const { data } = await axios.post(process.env.MOMO_ENDPOINT, payload);
    res.json(data);
  } catch (err) {
    res.status(502);
    throw new Error('Không gọi được MoMo API: ' + (err.response?.data?.message || err.message));
  }
});

// POST /api/payments/momo/ipn  (MoMo gọi ngược về server để báo kết quả)
const momoIpn = asyncHandler(async (req, res) => {
  const { orderId, resultCode } = req.body;
  const orderNumber = orderId?.split('-')[0];
  if (orderNumber) {
    const order = await Order.findOne({ orderNumber });
    if (order) {
      order.paymentStatus = resultCode === 0 ? 'paid' : 'failed';
      order.timeline.push({
        status: order.orderStatus,
        note: resultCode === 0 ? 'Thanh toán MoMo thành công' : 'Thanh toán MoMo thất bại',
        actor: 'momo',
        timestamp: new Date(),
      });
      await order.save();
    }
  }
  res.status(204).end();
});

// ================= ZALOPAY =================
// Docs: https://docs.zalopay.vn/v2/general/overview.html
const zalopayCreatePayment = asyncHandler(async (req, res) => {
  const { orderId, amount, orderInfo = 'Thanh toan don hang MegaTrip' } = req.body;
  if (!amount) {
    res.status(400);
    throw new Error('Thiếu số tiền thanh toán (amount)');
  }
  const appId = process.env.ZALOPAY_APP_ID;
  const key1 = process.env.ZALOPAY_KEY1;
  const transID = Math.floor(Math.random() * 1000000);
  const now = new Date();
  const appTransId = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${transID}`;

  const order = {
    app_id: appId,
    app_trans_id: appTransId,
    app_user: orderId || 'megatrip_user',
    app_time: Date.now(),
    item: JSON.stringify([{ orderId }]),
    embed_data: JSON.stringify({ redirecturl: process.env.ZALOPAY_CALLBACK_URL }),
    amount: Math.round(amount),
    description: orderInfo,
    bank_code: '',
    callback_url: process.env.ZALOPAY_CALLBACK_URL,
  };

  const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
  order.mac = crypto.createHmac('sha256', key1).update(data).digest('hex');

  try {
    const result = await axios.post(process.env.ZALOPAY_ENDPOINT, null, { params: order });
    res.json(result.data);
  } catch (err) {
    res.status(502);
    throw new Error('Không gọi được ZaloPay API: ' + (err.response?.data?.message || err.message));
  }
});

// POST /api/payments/zalopay/callback
const zalopayCallback = asyncHandler(async (req, res) => {
  const key2 = process.env.ZALOPAY_KEY2;
  const { data: dataStr, mac: reqMac } = req.body;
  const computedMac = crypto.createHmac('sha256', key2).update(dataStr).digest('hex');

  if (reqMac !== computedMac) {
    return res.json({ return_code: -1, return_message: 'mac not equal' });
  }
  try {
    const data = JSON.parse(dataStr);
    const items = JSON.parse(data.item || '[]');
    const orderId = items[0]?.orderId;
    if (orderId) {
      const order = await Order.findOne({ orderNumber: orderId });
      if (order) {
        order.paymentStatus = 'paid';
        order.timeline.push({ status: order.orderStatus, note: 'Thanh toán ZaloPay thành công', actor: 'zalopay', timestamp: new Date() });
        await order.save();
      }
    }
    res.json({ return_code: 1, return_message: 'success' });
  } catch (err) {
    res.json({ return_code: 0, return_message: err.message });
  }
});

module.exports = {
  vnpayCreatePaymentUrl,
  vnpayReturn,
  momoCreatePayment,
  momoIpn,
  zalopayCreatePayment,
  zalopayCallback,
};
