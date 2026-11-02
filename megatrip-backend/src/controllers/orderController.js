const asyncHandler = require('express-async-handler');
const { nanoid } = require('nanoid');
const Order = require('../models/Order');
const { isStaff, canAccessOrder } = require('../middleware/auth');

const mongoose = require('mongoose');

// Tìm đơn theo _id, orderNumber, hoặc mã dạng "MT123-1699999" (MoMo gắn thêm -requestId)
const findOrderFlexible = async (key, populate) => {
  if (!key) return null;
  const run = (q) => (populate ? q.populate(populate.path, populate.select) : q);
  if (mongoose.Types.ObjectId.isValid(key) && String(key).length === 24) {
    const byId = await run(Order.findById(key));
    if (byId) return byId;
  }
  let found = await run(Order.findOne({ orderNumber: key }));
  if (!found && String(key).includes('-')) {
    found = await run(Order.findOne({ orderNumber: String(key).split('-')[0] }));
  }
  return found;
};

const genOrderNumber = () => `MT${Date.now().toString().slice(-8)}${nanoid(4).toUpperCase()}`;

// GET /api/orders
const listOrders = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 10, orderStatus, paymentStatus, paymentMethod, type, search } = req.query;
  const filter = {};
  if (orderStatus) filter.orderStatus = orderStatus;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (type) filter['items.type'] = type;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { customerEmail: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  res.json({ data: orders, pagination: { total, current: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await findOrderFlexible(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  if (!canAccessOrder(req.user, order)) {
    res.status(403);
    throw new Error('Bạn không có quyền truy cập đơn hàng này');
  }
  res.json({ data: order });
});

// GET /api/orders/:id/details  &  /api/orders/:id/client/details
const getOrderDetails = asyncHandler(async (req, res) => {
  const order = await findOrderFlexible(req.params.id, { path: 'customerId', select: 'name email phone' });
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  if (!canAccessOrder(req.user, order)) {
    res.status(403);
    throw new Error('Bạn không có quyền truy cập đơn hàng này');
  }
  res.json({ data: order });
});

// GET /api/orders/customer/:customerId
const getOrdersByCustomer = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
  if (!isStaff(req.user) && String(req.params.customerId) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Bạn chỉ được xem đơn hàng của chính mình');
  }
  const filter = { customerId: req.params.customerId };
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  res.json({ data: orders, pagination: { total, current: Number(page), pageSize: Number(pageSize) } });
});

// POST /api/orders  (khách vãng lai hoặc đã đăng nhập; route dùng optionalAuth)
const createOrder = asyncHandler(async (req, res) => {
  const staff = isStaff(req.user);
  // Không tin các trường nhạy cảm do client gửi lên
  const { _id, id, timeline, notes, changeCalendar, dateChangeCalendar, ...body } = req.body || {};

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    res.status(400);
    throw new Error('Đơn hàng phải có ít nhất 1 mục');
  }
  for (const it of items) {
    const qty = Number(it.quantity ?? 1);
    const price = Number(it.unitPrice ?? 0);
    if (!Number.isFinite(qty) || qty < 1 || !Number.isFinite(price) || price < 0) {
      res.status(400);
      throw new Error('Số lượng hoặc đơn giá không hợp lệ');
    }
  }

  const subtotal = items.reduce((sum, it) => sum + (it.subtotal || it.unitPrice * it.quantity || 0), 0);
  const discountAmount = Math.min(Math.max(Number(body.discount?.amount) || 0, 0), subtotal);
  const tax = Math.max(Number(body.tax) || 0, 0);
  const total = Number(body.total ?? subtotal - discountAmount + tax);
  if (!Number.isFinite(total) || total < 0) {
    res.status(400);
    throw new Error('Tổng tiền không hợp lệ');
  }

  const data = {
    ...body,
    orderNumber: body.orderNumber || genOrderNumber(),
    subtotal,
    total,
    timeline: [{ status: 'pending', note: 'Đơn hàng được tạo', actor: body.customerName || 'system', timestamp: new Date() }],
  };
  if (!staff) {
    // Khách không được tự đặt trạng thái thanh toán/đơn hàng, và đơn luôn gắn với tài khoản đang đăng nhập
    data.paymentStatus = 'pending';
    data.orderStatus = 'pending';
    if (req.user) data.customerId = req.user._id;
    else delete data.customerId;
  }

  const order = await Order.create(data);
  res.status(201).json({ data: order });
});

// PUT /api/orders/:id
const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  const prevStatus = order.orderStatus;
  Object.assign(order, req.body);
  if (req.body.orderStatus && req.body.orderStatus !== prevStatus) {
    order.timeline.push({
      status: req.body.orderStatus,
      note: req.body.note || `Chuyển trạng thái sang ${req.body.orderStatus}`,
      actor: req.body.actor || 'admin',
      timestamp: new Date(),
    });
  }
  await order.save();
  res.json({ data: order });
});

// DELETE /api/orders/:id
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  res.json({ data: { message: 'Đã xoá đơn hàng' } });
});

// PUT /api/orders/:id/change-calendar
const changeOrderCalendar = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  if (!canAccessOrder(req.user, order)) {
    res.status(403);
    throw new Error('Bạn không có quyền truy cập đơn hàng này');
  }
  order.changeCalendar = true;
  order.dateChangeCalendar = req.body.dateChangeCalendar;
  order.timeline.push({
    status: order.orderStatus,
    note: `Yêu cầu đổi lịch sang ${req.body.dateChangeCalendar}`,
    actor: req.body.actor || 'customer',
    timestamp: new Date(),
  });
  await order.save();
  res.json({ data: order });
});

// GET /api/orders/stats/by-customers
const statsByCustomers = asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$customerId',
        customerName: { $first: '$customerName' },
        customerEmail: { $first: '$customerEmail' },
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$total' },
      },
    },
    { $sort: { totalSpent: -1 } },
  ]);
  res.json({ data: stats });
});

module.exports = {
  findOrderFlexible,
  listOrders,
  getOrderById,
  getOrderDetails,
  getOrdersByCustomer,
  createOrder,
  updateOrder,
  deleteOrder,
  changeOrderCalendar,
  statsByCustomers,
};
