const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const qs = require('qs');
const axios = require('axios');
const Order = require('../models/Order');
const { findOrderFlexible } = require('./orderController');

const CLIENT_URL = () => (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
const isStaff = (user) => user && ['admin', 'staff'].includes(user.role);
const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aa = Buffer.from(a, 'utf8'), bb = Buffer.from(b, 'utf8');
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
};
const getAuthorizedOrder = async (req, key) => {
  if (!key) { const e = new Error('Thiếu mã đơn hàng'); e.status = 400; throw e; }
  const order = await findOrderFlexible(key);
  if (!order) { const e = new Error('Không tìm thấy đơn hàng'); e.status = 404; throw e; }
  if (!isStaff(req.user) && String(order.customerId || '') !== String(req.user?._id || '')) {
    const e = new Error('Bạn không có quyền thanh toán đơn hàng này'); e.status = 403; throw e;
  }
  if (['paid', 'refunded'].includes(order.paymentStatus)) {
    const e = new Error('Đơn hàng đã được thanh toán hoặc hoàn tiền'); e.status = 409; throw e;
  }
  return order;
};


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
  const { orderId, orderInfo = 'Thanh toan don hang MegaTrip', bankCode, ipAddr } = req.body;
  const order = await getAuthorizedOrder(req, orderId);
  const amount = Math.round(Number(order.total));
  if (!Number.isFinite(amount) || amount <= 0) { res.status(400); throw new Error('Số tiền đơn hàng không hợp lệ'); }

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

// GET /vnpay/check-payment | /vnpay/return  (VNPay redirect trình duyệt về đây)
const vnpayReturn = asyncHandler(async (req, res) => {
  // Chỉ lấy các tham số vnp_* để ký (orderNumber do mình tự gắn thêm vào returnUrl, không nằm trong chữ ký)
  const vnp_Params = {};
  Object.keys(req.query).forEach((k) => {
    if (k.startsWith('vnp_') && k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType') vnp_Params[k] = req.query[k];
  });
  const secureHash = req.query.vnp_SecureHash;

  const signData = qs.stringify(sortObject(vnp_Params), { encode: false });
  const checkSum = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET).update(Buffer.from(signData, 'utf-8')).digest('hex');
  const isValid = safeEqual(checkSum, secureHash);
  const isSuccess = isValid && vnp_Params.vnp_ResponseCode === '00';

  const orderNumber = req.query.orderNumber || String(vnp_Params.vnp_TxnRef || '').split('-')[0];
  let order = null;
  if (orderNumber) {
    order = await findOrderFlexible(orderNumber);
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

  // Đưa người dùng quay lại website (nếu gọi từ trình duyệt)
  if (req.accepts(['html', 'json']) === 'html') {
    const ref = encodeURIComponent((order && order.orderNumber) || orderNumber || '');
    return res.redirect(
      isSuccess ? `${CLIENT_URL()}/thanh-toan-thanh-cong?orderId=${ref}` : `${CLIENT_URL()}/thanh-toan?payment=failed&orderId=${ref}`
    );
  }
  res.json({ isValid, isSuccess, data: vnp_Params });
});

// ================= MOMO =================
// Docs: https://developers.momo.vn/v3/docs/payment/api/wallet/onetime
const momoCreatePayment = asyncHandler(async (req, res) => {
  const { orderId, orderInfo = 'Thanh toan don hang MegaTrip' } = req.body;
  const order = await getAuthorizedOrder(req, orderId);
  const amount = Math.round(Number(order.total));
  if (!Number.isFinite(amount) || amount <= 0) { res.status(400); throw new Error('Số tiền đơn hàng không hợp lệ'); }

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const redirectUrl = process.env.MOMO_REDIRECT_URL || `${CLIENT_URL()}/thanh-toan-thanh-cong`;
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
  const body = req.body || {};
  const secretKey = process.env.MOMO_SECRET_KEY;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  if (!secretKey || !accessKey) return res.status(503).json({ message: 'MoMo IPN chưa được cấu hình' });
  const rawSignature = [
    `accessKey=${accessKey}`, `amount=${body.amount}`, `extraData=${body.extraData || ''}`,
    `message=${body.message || ''}`, `orderId=${body.orderId}`, `orderInfo=${body.orderInfo || ''}`,
    `orderType=${body.orderType || ''}`, `partnerCode=${body.partnerCode}`, `payType=${body.payType || ''}`,
    `requestId=${body.requestId}`, `responseTime=${body.responseTime}`, `resultCode=${body.resultCode}`,
    `transId=${body.transId}`,
  ].join('&');
  const expected = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  if (!safeEqual(expected, body.signature)) return res.status(400).json({ message: 'Chữ ký MoMo không hợp lệ' });
  const order = await findOrderFlexible(body.orderId);
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng tương ứng' });
  if (Number(body.amount) !== Math.round(Number(order.total))) return res.status(400).json({ message: 'Số tiền IPN không khớp đơn hàng' });
  if (body.resultCode === 0 || body.resultCode === '0') {
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.timeline.push({ status: order.orderStatus, note: 'Thanh toán MoMo thành công (IPN đã xác minh chữ ký)', actor: 'momo', timestamp: new Date() });
      await order.save();
    }
  } else if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'failed';
    order.timeline.push({ status: order.orderStatus, note: 'Thanh toán MoMo thất bại', actor: 'momo', timestamp: new Date() });
    await order.save();
  }
  res.status(204).end();
});

// ================= ZALOPAY =================
// Docs: https://docs.zalopay.vn/v2/general/overview.html
const zalopayCreatePayment = asyncHandler(async (req, res) => {
  const { orderId, description, orderInfo, app_user } = req.body;
  const orderRecord = await getAuthorizedOrder(req, orderId);
  const amount = Math.round(Number(orderRecord.total));
  if (!Number.isFinite(amount) || amount <= 0) { res.status(400); throw new Error('Số tiền đơn hàng không hợp lệ'); }
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
    app_user: app_user || orderId || 'megatrip_user',
    app_time: Date.now(),
    item: JSON.stringify([{ orderId }]),
    embed_data: JSON.stringify({ redirecturl: `${CLIENT_URL()}/thanh-toan-thanh-cong?orderId=${encodeURIComponent(orderId || '')}`, orderNumber: orderId }),
    amount: Math.round(amount),
    description: description || orderInfo || 'Thanh toan don hang MegaTrip',
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

  if (!safeEqual(reqMac, computedMac)) {
    return res.json({ return_code: -1, return_message: 'mac not equal' });
  }
  try {
    const data = JSON.parse(dataStr);
    const items = JSON.parse(data.item || '[]');
    const orderId = items[0]?.orderId;
    if (orderId) {
      const order = await findOrderFlexible(orderId);
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

// ================= REFUND =================
// POST /momo/refund  { orderId, amount, transId, description }
const momoRefund = asyncHandler(async (req, res) => {
  const { orderId, transId, description = 'Hoan tien don hang MegaTrip' } = req.body;
  if (!orderId || !transId) { res.status(400); throw new Error('Thiếu orderId / transId'); }
  const order = await findOrderFlexible(orderId);
  if (!order || order.paymentStatus !== 'paid') { res.status(400); throw new Error('Chỉ được hoàn tiền đơn đã thanh toán'); }
  const amount = Math.round(Number(order.total));
  if (!Number.isFinite(amount) || amount <= 0) { res.status(400); throw new Error('Số tiền hoàn không hợp lệ'); }
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const requestId = `${Date.now()}`;
  const raw = `accessKey=${accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}&transId=${transId}`;
  const signature = crypto.createHmac('sha256', secretKey).update(raw).digest('hex');
  try {
    const endpoint = process.env.MOMO_REFUND_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/refund';
    const { data } = await axios.post(endpoint, {
      partnerCode, orderId, requestId, amount: Number(amount), transId: Number(transId), lang: 'vi', description, signature,
    });
    res.json(data);
  } catch (err) {
    res.status(502);
    throw new Error('Không gọi được MoMo refund: ' + (err.response?.data?.message || err.message));
  }
});

// POST /zalo/refund  { zp_trans_id, amount, description }
const zalopayRefund = asyncHandler(async (req, res) => {
  const { zp_trans_id, orderId, description = 'Hoan tien don hang MegaTrip' } = req.body;
  if (!zp_trans_id || !orderId) { res.status(400); throw new Error('Thiếu zp_trans_id / orderId'); }
  const orderRecord = await findOrderFlexible(orderId);
  if (!orderRecord || orderRecord.paymentStatus !== 'paid') { res.status(400); throw new Error('Chỉ được hoàn tiền đơn đã thanh toán'); }
  const amount = Math.round(Number(orderRecord.total));
  if (!Number.isFinite(amount) || amount <= 0) { res.status(400); throw new Error('Số tiền hoàn không hợp lệ'); }
  const appId = process.env.ZALOPAY_APP_ID;
  const key1 = process.env.ZALOPAY_KEY1;
  const timestamp = Date.now();
  const now = new Date();
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const m_refund_id = `${yymmdd}_${appId}_${timestamp}${Math.floor(Math.random() * 1000)}`;
  const params = { app_id: appId, m_refund_id, timestamp, zp_trans_id, amount: Math.round(amount), description };
  const data = `${params.app_id}|${params.zp_trans_id}|${params.amount}|${params.description}|${params.timestamp}`;
  params.mac = crypto.createHmac('sha256', key1).update(data).digest('hex');
  try {
    const endpoint = process.env.ZALOPAY_REFUND_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/refund';
    const result = await axios.post(endpoint, qs.stringify(params), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    res.json(result.data);
  } catch (err) {
    res.status(502);
    throw new Error('Không gọi được ZaloPay refund: ' + (err.response?.data?.return_message || err.message));
  }
});

module.exports = {
  vnpayCreatePaymentUrl,
  vnpayReturn,
  momoCreatePayment,
  momoIpn,
  zalopayCreatePayment,
  zalopayCallback,
  momoRefund,
  zalopayRefund,
};
