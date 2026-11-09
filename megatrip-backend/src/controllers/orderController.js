const asyncHandler = require('express-async-handler');
const { nanoid } = require('nanoid');
const Order = require('../models/Order');

const mongoose = require('mongoose');
const { clean, escapeRegex, paging } = require('../utils/listQuery');

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

const isStaff = (user) => user && ['admin', 'staff'].includes(user.role);
const canAccessOrder = (user, order) => isStaff(user) || (user && order.customerId && String(order.customerId) === String(user._id));
const assertOrderAccess = (req, order) => { if (!canAccessOrder(req.user, order)) { const e = new Error('Bạn không có quyền truy cập đơn hàng này'); e.status = 403; throw e; } };

const genOrderNumber = () => `MT${Date.now().toString().slice(-8)}${nanoid(4).toUpperCase()}`;

// GET /api/orders
const listOrders = asyncHandler(async (req, res) => {
  const { page, pageSize } = paging(req.query, 10);
  const orderStatus = clean(req.query.orderStatus);
  const paymentStatus = clean(req.query.paymentStatus);
  const paymentMethod = clean(req.query.paymentMethod);
  const type = clean(req.query.type);
  const search = clean(req.query.search ?? req.query.q);
  const filter = {};
  if (orderStatus) filter.orderStatus = orderStatus;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (type) filter['items.type'] = type;
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ orderNumber: rx }, { customerName: rx }, { customerEmail: rx }];
  }
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  res.json({ data: orders, pagination: { total, current: page, pageSize } });
});

// PUT /api/orders/:id/cancel  { note }  — admin hủy đơn
// Lưu ý: chỉ đổi trạng thái đơn. Hoàn tiền thật phải thực hiện qua cổng thanh toán (route /momo/refund, /zalo/refund).
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await findOrderFlexible(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  if (order.orderStatus === 'cancelled') {
    return res.json({ data: order });
  }
  if (order.orderStatus === 'completed') {
    res.status(400);
    throw new Error('Không thể hủy đơn đã hoàn thành');
  }
  const needRefund = order.paymentStatus === 'paid';
  order.orderStatus = 'cancelled';
  order.timeline.push({
    status: 'cancelled',
    note: `${(req.body && req.body.note) || 'Đơn hàng bị hủy bởi admin'}${needRefund ? ' — đơn đã thanh toán, cần hoàn tiền cho khách' : ''}`,
    actor: (req.user && req.user.email) || 'admin',
    timestamp: new Date(),
  });
  await order.save();
  res.json({ data: order, needRefund });
});

// GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await findOrderFlexible(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  assertOrderAccess(req, order);
  res.json({ data: order });
});

// GET /api/orders/:id/details  &  /api/orders/:id/client/details
const getOrderDetails = asyncHandler(async (req, res) => {
  const order = await findOrderFlexible(req.params.id, { path: 'customerId', select: 'name email phone' });
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  assertOrderAccess(req, order);
  res.json({ data: order });
});

// GET /api/orders/customer/:customerId
const getOrdersByCustomer = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
  if (!isStaff(req.user) && String(req.user._id) !== String(req.params.customerId)) { res.status(403); throw new Error('Bạn không có quyền xem đơn hàng của khách khác'); }
  const filter = { customerId: req.params.customerId };
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  res.json({ data: orders, pagination: { total, current: Number(page), pageSize: Number(pageSize) } });
});

// POST /api/orders
const createOrder = asyncHandler(async (req, res) => {
  const body = req.body;
  const subtotal = (body.items || []).reduce((sum, it) => sum + (it.subtotal || it.unitPrice * it.quantity || 0), 0);
  const discountAmount = body.discount?.amount || 0;
  const tax = body.tax || 0;
  const total = body.total ?? subtotal - discountAmount + tax;

  const order = await Order.create({
    ...body,
    customerId: req.user._id,
    orderNumber: body.orderNumber || genOrderNumber(),
    subtotal,
    total,
    timeline: [{ status: 'pending', note: 'Đơn hàng được tạo', actor: body.customerName || 'system', timestamp: new Date() }],
  });
  res.status(201).json({ data: order });
});

// PUT /api/orders/:id
const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  assertOrderAccess(req, order);
  const prevStatus = order.orderStatus;
  if (isStaff(req.user)) {
    const allowed = ['orderStatus', 'paymentStatus', 'notes', 'customerName', 'customerEmail', 'customerPhone', 'customerAddress', 'changeCalendar', 'dateChangeCalendar'];
    for (const key of allowed) if (req.body[key] !== undefined) order[key] = req.body[key];
  } else if (req.body.dateChangeCalendar !== undefined) {
    order.changeCalendar = true;
    order.dateChangeCalendar = String(req.body.dateChangeCalendar).slice(0, 100);
  } else {
    res.status(403);
    throw new Error('Khách hàng chỉ được gửi yêu cầu đổi lịch');
  }
  if (isStaff(req.user) && req.body.orderStatus && req.body.orderStatus !== prevStatus) {
    order.timeline.push({
      status: req.body.orderStatus,
      note: typeof req.body.note === 'string' ? req.body.note.slice(0, 500) : `Chuyển trạng thái sang ${req.body.orderStatus}`,
      actor: req.user.role,
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
  assertOrderAccess(req, order);
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

// GET|POST /api/orders/stats/by-customers
// - có `ids` (body hoặc query): trả về map { [customerId]: { totalOrders, totalSpent, lastOrderAt } }
// - không có ids: trả về danh sách thống kê của mọi khách (hành vi cũ)
const statsByCustomers = asyncHandler(async (req, res) => {
  let ids = req.body && req.body.ids ? req.body.ids : req.query.ids;
  if (typeof ids === 'string') ids = ids.split(',');
  const hasIds = Array.isArray(ids) && ids.length > 0;

  const match = { customerId: { $ne: null } };
  if (hasIds) {
    const objectIds = ids.filter((i) => mongoose.Types.ObjectId.isValid(i)).map((i) => new mongoose.Types.ObjectId(i));
    match.customerId = { $in: objectIds };
  }
  const stats = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$customerId',
        customerName: { $first: '$customerName' },
        customerEmail: { $first: '$customerEmail' },
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 0, '$total'] } },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
    { $sort: { totalSpent: -1 } },
  ]);
  if (!hasIds) return res.json({ data: stats });

  const map = {};
  for (const st of stats) {
    map[String(st._id)] = { totalOrders: st.totalOrders, totalSpent: st.totalSpent, lastOrderAt: st.lastOrderAt };
  }
  res.json({ data: map });
});

module.exports = {
  findOrderFlexible,
  cancelOrder,
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
