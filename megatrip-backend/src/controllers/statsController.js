const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Tour = require('../models/Tour');
const Bus = require('../models/Bus');

// Parse start/end từ query, mặc định 30 ngày gần nhất
const parseRange = (query) => {
  const end = query.end ? new Date(query.end) : new Date();
  const start = query.start ? new Date(query.start) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
};

const formatVND = (n) => `${new Intl.NumberFormat('vi-VN').format(Math.round(n || 0))} VNĐ`;

// Tên tháng ngắn gọn dùng cho trục biểu đồ: "T1", "T2"...
const monthLabel = (y, m) => `T${m}`;

// GET /api/stats/dashboard?start&end
const getDashboardStats = asyncHandler(async (req, res) => {
  const { start, end } = parseRange(req.query);
  const periodMs = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - periodMs);
  const prevEnd = start;

  const currentOrders = await Order.find({ createdAt: { $gte: start, $lte: end } });
  const prevOrders = await Order.find({ createdAt: { $gte: prevStart, $lte: prevEnd } });

  const sumPaid = (orders) =>
    orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + (o.total || 0), 0);

  const totalRevenue = sumPaid(currentOrders);
  const prevRevenue = sumPaid(prevOrders);
  const changePercent = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0;

  const [tourCount, busCount] = await Promise.all([Tour.countDocuments(), Bus.countDocuments()]);

  res.json({
    totalRevenue,
    totalOrders: currentOrders.length,
    revenueComparison: { current: totalRevenue, previous: prevRevenue, changePercent },
    totalProducts: { tours: tourCount, buses: busCount },
  });
});

// GET /api/stats/revenue?start&end
const getRevenueStats = asyncHandler(async (req, res) => {
  const { start, end } = parseRange(req.query);

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end }, paymentStatus: 'paid' });

  // revenueOverTime: gộp theo tháng, tách theo loại dịch vụ (flight/tour/bus)
  const byMonth = {};
  // revenueByType: tổng theo loại dịch vụ, không chia theo tháng
  const byType = { flight: 0, tour: 0, bus: 0 };

  for (const order of orders) {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!byMonth[key]) {
      byMonth[key] = { period: monthLabel(d.getFullYear(), d.getMonth() + 1), flight: 0, tour: 0, bus: 0, _sort: d.getFullYear() * 100 + (d.getMonth() + 1) };
    }
    for (const item of order.items || []) {
      const amount = item.subtotal || item.unitPrice * item.quantity || 0;
      if (byMonth[key][item.type] !== undefined) byMonth[key][item.type] += amount;
      if (byType[item.type] !== undefined) byType[item.type] += amount;
    }
  }

  const revenueOverTime = Object.values(byMonth).sort((a, b) => a._sort - b._sort).map(({ _sort, ...rest }) => rest);
  const revenueByType = Object.entries(byType)
    .filter(([, revenue]) => revenue > 0)
    .map(([_id, revenue]) => ({ _id, revenue }));

  res.json({ revenueOverTime, revenueByType });
});

// GET /api/stats/products?start&end
const getProductStats = asyncHandler(async (req, res) => {
  const { start, end } = parseRange(req.query);
  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } });

  const grouped = {};
  for (const order of orders) {
    for (const item of order.items || []) {
      const key = `${item.type}::${item.name}`;
      if (!grouped[key]) {
        grouped[key] = { _id: key, name: item.name, type: item.type, bookings: 0, revenue: 0 };
      }
      grouped[key].bookings += item.quantity || 1;
      grouped[key].revenue += item.subtotal || item.unitPrice * item.quantity || 0;
    }
  }

  const topBookedProducts = Object.values(grouped).sort((a, b) => b.bookings - a.bookings);

  res.json({ topBookedProducts });
});

// GET /api/stats/activities?start&end
const getActivities = asyncHandler(async (req, res) => {
  const { start, end } = parseRange(req.query);
  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .sort({ createdAt: -1 })
    .limit(15);

  const timeAgo = (date) => {
    const diffMs = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  const activities = orders.map((o) => {
    const isCancelled = o.orderStatus === 'cancelled';
    const firstItem = (o.items || [])[0];
    return {
      id: o._id.toString(),
      type: isCancelled ? 'cancelled' : 'order',
      serviceType: firstItem?.type || 'tour',
      urgent: o.orderStatus === 'pending' || isCancelled,
      message: isCancelled
        ? `Đơn hàng ${o.orderNumber} đã bị huỷ`
        : `${o.customerName || 'Khách hàng'} đã đặt ${firstItem?.name || 'dịch vụ'}`,
      customer: o.customerName || o.customerEmail || '',
      amount: formatVND(o.total),
      time: timeAgo(o.createdAt),
    };
  });

  res.json({ activities });
});

module.exports = { getDashboardStats, getRevenueStats, getProductStats, getActivities };
