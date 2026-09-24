const asyncHandler = require('express-async-handler');
const { nanoid } = require('nanoid');
const Order = require('../models/Order');

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
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  res.json(order);
});

// GET /api/orders/:id/details  &  /api/orders/:id/client/details
const getOrderDetails = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customerId', 'name email phone');
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  res.json(order);
});

// GET /api/orders/customer/:customerId
const getOrdersByCustomer = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
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
    orderNumber: body.orderNumber || genOrderNumber(),
    subtotal,
    total,
    timeline: [{ status: 'pending', note: 'Đơn hàng được tạo', actor: body.customerName || 'system', timestamp: new Date() }],
  });
  res.status(201).json(order);
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
  res.json(order);
});

// DELETE /api/orders/:id
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }
  res.json({ message: 'Đã xoá đơn hàng' });
});

// PUT /api/orders/:id/change-calendar
const changeOrderCalendar = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
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
  res.json(order);
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
  res.json(stats);
});

module.exports = {
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
