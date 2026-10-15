const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');
const { sendMail } = require('../utils/mailer');

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
  res.json({ data: ticket });
});

// POST /api/support
const createTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.create(req.body);
  res.status(201).json({ data: ticket });
});

// PUT /api/support/:id
const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!ticket) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu hỗ trợ');
  }
  res.json({ data: ticket });
});

// DELETE /api/support/:id
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu hỗ trợ');
  }
  res.json({ data: { message: 'Đã xoá yêu cầu hỗ trợ' } });
});

// POST /api/support/:id/messages  (payload admin gửi: { text, authorType, authorId })
const addTicketResponse = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) { res.status(404); throw new Error('Không tìm thấy yêu cầu hỗ trợ'); }
  const { text, content, authorType, authorId, authorName, isInternal } = req.body;
  ticket.responses.push({
    content: text || content || '',
    authorType: authorType || 'customer',
    authorId, authorName, isInternal: !!isInternal,
  });
  if (ticket.status === 'new') ticket.status = 'open';
  await ticket.save();
  res.status(201).json({ data: ticket, message: 'Đã gửi phản hồi' });
});

// POST /api/support/send-response-email  { ticketId, email, responseDetails }
const sendResponseEmail = asyncHandler(async (req, res) => {
  const { ticketId, email, responseDetails } = req.body;
  if (!email) { res.status(400); throw new Error('Thiếu địa chỉ email người nhận'); }
  const ticket = ticketId ? await Ticket.findById(ticketId) : null;
  const bodyText = typeof responseDetails === 'string' ? responseDetails : JSON.stringify(responseDetails || {}, null, 2);
  await sendMail({
    to: email,
    subject: `MegaTrip - Phản hồi yêu cầu hỗ trợ${ticket ? ': ' + ticket.title : ''}`,
    html: `<p>${bodyText.replace(/\n/g, '<br/>')}</p>`,
  });
  res.json({ data: { message: 'Đã gửi email phản hồi' } });
});

module.exports = { listTickets, getTicketById, createTicket, updateTicket, deleteTicket, addTicketResponse, sendResponseEmail };
