const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');

// GET /api/support
const listTickets = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 10, status, priority, category, assignedTo, customerId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (customerId) filter.customerId = customerId;
  const total = await Ticket.countDocuments(filter);
  const data = await Ticket.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  res.json({ data, pagination: { total, current: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/tickets/:id  (chi tiết 1 ticket, gồm cả responses)
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu hỗ trợ');
  }
  res.json(ticket);
});

// POST /api/support
const createTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.create(req.body);
  res.status(201).json(ticket);
});

// PUT /api/support/:id
const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!ticket) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu hỗ trợ');
  }
  res.json(ticket);
});

// DELETE /api/support/:id
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu hỗ trợ');
  }
  res.json({ message: 'Đã xoá yêu cầu hỗ trợ' });
});

// POST /api/tickets/:id/responses  (thêm phản hồi vào ticket)
const addTicketResponse = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu hỗ trợ');
  }
  ticket.responses.push(req.body);
  if (ticket.status === 'new') ticket.status = 'open';
  await ticket.save();
  res.status(201).json(ticket);
});

module.exports = { listTickets, getTicketById, createTicket, updateTicket, deleteTicket, addTicketResponse };
