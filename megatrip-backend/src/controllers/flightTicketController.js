const asyncHandler = require('express-async-handler');
const FlightTicket = require('../models/FlightTicket');
const mongoose = require('mongoose');
const isStaff = (user) => user && ['admin', 'staff'].includes(user.role);

// GET /api/tickets?type=flight&status=paid&status=changed
const listTickets = asyncHandler(async (req, res) => {
  const filter = {};
  if (!isStaff(req.user)) filter.customerId = req.user._id;
  if (req.query.status) {
    const statuses = Array.isArray(req.query.status) ? req.query.status : [req.query.status];
    filter.status = { $in: statuses };
  }
  if (isStaff(req.user) && req.query.customerId) filter.customerId = req.query.customerId;
  if (req.query.orderId) filter.orderId = req.query.orderId;
  const tickets = await FlightTicket.find(filter).sort({ createdAt: -1 });
  res.json({ data: tickets });
});

// GET /api/tickets/:id
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await FlightTicket.findById(req.params.id);
  if (!ticket) { res.status(404); throw new Error('Không tìm thấy vé'); }
  res.json({ data: ticket });
});

module.exports = { listTickets, getTicketById };
