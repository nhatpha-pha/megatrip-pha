const asyncHandler = require('express-async-handler');
const Bus = require('../models/Bus');
const { clean, escapeRegex, paging, parseIds } = require('../utils/listQuery');

// GET /api/buses  (bỏ qua các bộ lọc "all" do trang admin gửi lên)
const listBuses = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const { page, pageSize } = paging(req.query, 12);
  const status = clean(req.query.status);
  const operator = clean(req.query.operator);
  const route = clean(req.query.route);
  const search = clean(req.query.search ?? req.query.q);

  const filter = {};
  const and = [];
  if (from) filter['routeFrom.code'] = from;
  if (to) filter['routeTo.code'] = to;
  if (status) filter.status = status === 'scheduled' ? 'active' : status; // 'scheduled' (client) ~ 'active'
  if (operator) and.push({ $or: [{ 'operator.id': operator }, { 'operator.code': operator }, { 'operator.name': operator }] });
  const routeOr = (term) => {
    const rx = { $regex: escapeRegex(term), $options: 'i' };
    return { $or: ['routeFrom.code', 'routeFrom.name', 'routeFrom.city', 'routeTo.code', 'routeTo.name', 'routeTo.city'].map((k) => ({ [k]: rx })) };
  };
  if (route) and.push(routeOr(route));
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    and.push({ $or: [{ busCode: rx }, { 'operator.name': rx }, ...routeOr(search).$or] });
  }
  if (and.length) filter.$and = and;

  const sortable = ['createdAt', 'adultPrice', 'departureAt', 'busCode', 'seatsBooked'];
  const sortBy = sortable.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const total = await Bus.countDocuments(filter);
  const buses = await Bus.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  res.json({ data: buses, pagination: { total, current: page, pageSize } });
});

// POST /api/buses/bulk  { action: 'activate' | 'cancel' | 'delete', ids: [] }
const bulkBuses = asyncHandler(async (req, res) => {
  const ids = parseIds(req.body);
  const { action } = req.body || {};
  if (!ids.length) {
    res.status(400);
    throw new Error('Chưa chọn chuyến xe nào');
  }
  let result;
  if (action === 'activate') result = await Bus.updateMany({ _id: { $in: ids } }, { $set: { status: 'active' } });
  else if (action === 'cancel') result = await Bus.updateMany({ _id: { $in: ids } }, { $set: { status: 'hidden' } });
  else if (action === 'delete') result = await Bus.deleteMany({ _id: { $in: ids } });
  else {
    res.status(400);
    throw new Error('Thao tác không hợp lệ');
  }
  res.json({ data: { action, affected: result.modifiedCount ?? result.deletedCount ?? 0 } });
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

// Chuẩn hóa dữ liệu admin gửi lên: chuỗi "a, b" -> mảng; bỏ giá trị rỗng
const toList = (v) => (Array.isArray(v) ? v : String(v ?? '').split(',')).map((x) => String(x).trim()).filter(Boolean);
const normalizeBusBody = (body) => {
  const out = { ...body };
  ['amenities', 'busType', 'pickupPoints', 'dropoffPoints'].forEach((k) => {
    if (out[k] !== undefined) out[k] = toList(out[k]);
  });
  if (out.seatMap !== undefined && !Array.isArray(out.seatMap)) delete out.seatMap;
  if (out.operator && typeof out.operator !== 'object') delete out.operator;
  return out;
};

// POST /api/buses
const createBus = asyncHandler(async (req, res) => {
  const bus = await Bus.create(normalizeBusBody(req.body));
  res.status(201).json({ data: bus });
});

// PUT /api/buses/:id
const updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndUpdate(req.params.id, normalizeBusBody(req.body), { new: true, runValidators: true });
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
// GET /api/buses/bus-slots/:id
// Trả về { dateBookings: [{ dateIso, seatsAvailable, seatsBooked, seatmapFill, logSeatBooked }], data: slots }
// - admin dùng dateBookings để biết ngày nào đã có người đặt
// - trang khách dùng seatmapFill / seatsAvailable để vẽ sơ đồ ghế theo từng ngày
const getBusSlots = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) {
    res.status(404);
    throw new Error('Không tìm thấy chuyến xe');
  }
  const day = (d) => String(d || '').slice(0, 10);
  const dates = (bus.departureDates && bus.departureDates.length ? bus.departureDates : bus.departureAt ? [bus.departureAt] : []).map(day);
  const baseMap = Array.isArray(bus.seatMap) ? bus.seatMap : [];
  const total = Number(bus.seatsTotal) || baseMap.length || 0;

  const dateBookings = dates.map((dateIso) => {
    const slot = (bus.slots || []).find((s) => day(s.date) === dateIso);
    const bookedNumbers = new Set(
      ((slot && slot.seatMap) || []).filter((x) => x.status !== 'available').map((x) => String(x.seatNumber))
    );
    const seatmapFill = baseMap.map((seat) => {
      const key = String(seat.label ?? seat.seatId);
      const isTaken = bookedNumbers.has(key) || bookedNumbers.has(String(seat.seatId));
      return { ...seat, status: isTaken ? 'booked' : seat.status === 'booked' ? 'available' : seat.status || 'available' };
    });
    const bookedCount = slot && slot.seatMap && slot.seatMap.length ? bookedNumbers.size : Number(bus.seatsBooked) || 0;
    return {
      dateIso,
      seatsTotal: total,
      seatsBooked: bookedCount,
      seatsAvailable: Math.max(total - bookedCount, 0),
      seatmapFill,
      logSeatBooked: [],
    };
  });
  res.json({ data: bus.slots || [], dateBookings });
});

module.exports = { listBuses, bulkBuses, getBusById, createBus, updateBus, deleteBus, getBusSlots };
