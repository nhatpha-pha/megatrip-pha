const asyncHandler = require('express-async-handler');
const FlightTicket = require('../models/FlightTicket');

const { isStaff } = require('../middleware/auth');

// GET /api/tickets?type=flight&status=paid&status=changed
// - admin/staff: xem tất cả, đầy đủ thông tin
// - khách đăng nhập hỏi đúng customerId của mình: xem vé của mình, đầy đủ thông tin
// - còn lại (kể cả khách vãng lai, cần để hiển thị ghế đã bán): chỉ trả dữ liệu ghế, không có thông tin cá nhân/đơn hàng
const listTickets = asyncHandler(async (req, res) => {
  const filter = {};
  const requested = req.query.status ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) : null;
  const staff = isStaff(req.user);
  const own = req.user && req.query.customerId && String(req.query.customerId) === String(req.user._id);

  if (staff || own) {
    if (requested) filter.status = { $in: requested };
    if (req.query.customerId) filter.customerId = req.query.customerId;
    if (staff && req.query.orderId) filter.orderId = req.query.orderId;
    const tickets = await FlightTicket.find(filter).sort({ createdAt: -1 });
    return res.json({ data: tickets });
  }

  const publicStatuses = ['paid', 'changed'];
  const statuses = requested ? requested.filter((st) => publicStatuses.includes(st)) : publicStatuses;
  filter.status = { $in: statuses.length ? statuses : publicStatuses };
  const tickets = await FlightTicket.find(filter)
    .select('status seats pricing.seats reservationInfo.flights')
    .sort({ createdAt: -1 })
    .limit(2000);
  res.json({ data: tickets });
});

// GET /api/tickets/:id  (route dùng protect)
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await FlightTicket.findById(req.params.id);
  if (!ticket) { res.status(404); throw new Error('Không tìm thấy vé'); }
  if (!isStaff(req.user) && String(ticket.customerId || '') !== String(req.user._id)) {
    res.status(403);
    throw new Error('Bạn không có quyền xem vé này');
  }
  res.json({ data: ticket });
});

module.exports = { listTickets, getTicketById };
