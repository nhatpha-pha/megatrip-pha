const asyncHandler = require('express-async-handler');
const Bus = require('../models/Bus');

// GET /api/buses
const listBuses = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 12, from, to, status } = req.query;
  const filter = {};
  if (from) filter['routeFrom.code'] = from;
  if (to) filter['routeTo.code'] = to;
  if (status) filter.status = status;
  const total = await Bus.countDocuments(filter);
  const buses = await Bus.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  res.json({ data: buses, pagination: { total, current: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/buses/:id
const getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) {
    res.status(404);
    throw new Error('Không tìm thấy chuyến xe');
  }
  res.json({ data: bus });
});

// POST /api/buses
const createBus = asyncHandler(async (req, res) => {
  const bus = await Bus.create(req.body);
  res.status(201).json({ data: bus });
});

// PUT /api/buses/:id
const updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!bus) {
    res.status(404);
    throw new Error('Không tìm thấy chuyến xe');
  }
  res.json({ data: bus });
});

// DELETE /api/buses/:id
const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndDelete(req.params.id);
  if (!bus) {
    res.status(404);
    throw new Error('Không tìm thấy chuyến xe');
  }
  res.json({ data: { message: 'Đã xoá chuyến xe' } });
});

// GET /api/buses/bus-slots/:id  (id = busId)
const getBusSlots = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) {
    res.status(404);
    throw new Error('Không tìm thấy chuyến xe');
  }
  res.json({ data: bus.slots || [] });
});

module.exports = { listBuses, getBusById, createBus, updateBus, deleteBus, getBusSlots };
