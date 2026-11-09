const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const Tour = require('../models/Tour');
const { clean, escapeRegex, paging } = require('../utils/listQuery');

const buildFilter = (query) => {
  const search = clean(query.search);
  const status = clean(query.status);
  const categoryId = clean(query.categoryId);
  const difficulty = clean(query.difficulty);
  const filter = {};
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
  if (status) filter.status = status;
  if (categoryId) filter.categoryId = categoryId;
  if (difficulty) filter.difficulty = difficulty;
  return filter;
};

// GET /api/tours
const listTours = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 12 } = req.query;
  const filter = buildFilter(req.query);
  const total = await Tour.countDocuments(filter);
  const tours = await Tour.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  res.json({ data: tours, pagination: { total, current: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/tours/admin?page&pageSize&visibility=true|false&category&search  (admin thấy cả tour đang ẩn)
const listToursAdmin = asyncHandler(async (req, res) => {
  const { page, pageSize } = paging(req.query, 10);
  const filter = {};
  const visibility = clean(req.query.visibility);
  const category = clean(req.query.category ?? req.query.categoryId);
  const search = clean(req.query.search ?? req.query.q);
  if (visibility === 'true' || visibility === 'false') filter.isVisible = visibility === 'true';
  if (category) filter.categoryId = category;
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
  const total = await Tour.countDocuments(filter);
  const tours = await Tour.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  res.json({ data: tours, total, pagination: { total, current: page, pageSize } });
});

// GET /api/tours/slug/:slug
const getTourBySlug = asyncHandler(async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug });
  if (!tour) {
    res.status(404);
    throw new Error('Không tìm thấy tour');
  }
  res.json({ data: tour });
});

// GET /api/tours/:id
const getTourById = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    res.status(404);
    throw new Error('Không tìm thấy tour');
  }
  res.json({ data: tour });
});

const dayOf = (d) => String(d || '').slice(0, 10);

// Chuẩn hóa dữ liệu admin: lịch trình, trạng thái theo ẩn/hiện
const normalizeTourBody = (body) => {
  const out = { ...body };
  if (Array.isArray(out.itinerary)) {
    out.itinerary = out.itinerary.map((it, i) => ({
      ...it,
      dayNumber: it.dayNumber ?? it.day ?? i + 1,
      day: it.day ?? it.dayNumber ?? i + 1,
      title: it.title ?? it.address ?? '',
      address: it.address ?? it.title ?? '',
      details: it.details ?? it.description ?? '',
      description: it.description ?? it.details ?? '',
    }));
  }
  // Admin chỉ gửi isVisible -> đồng bộ status để trang khách lọc đúng
  if (out.status === undefined && out.isVisible !== undefined) out.status = out.isVisible ? 'active' : 'hidden';
  if (out.duration !== undefined && out.duration !== null) out.duration = String(out.duration);
  return out;
};

// Tạo / giữ lịch khởi hành (slots) khớp với danh sách ngày khởi hành, giữ nguyên số chỗ đã đặt của ngày cũ
const syncSlots = (startDates, existingSlots, maxGroupSize) => {
  const existing = new Map((existingSlots || []).map((s) => [dayOf(s.date), s]));
  return (startDates || []).map((d) => {
    const key = dayOf(d);
    const old = existing.get(key);
    return old
      ? { date: key, seatsAvailable: maxGroupSize || old.seatsAvailable, seatsBooked: old.seatsBooked || 0, status: old.status || 'open' }
      : { date: key, seatsAvailable: maxGroupSize || 0, seatsBooked: 0, status: 'open' };
  });
};

// POST /api/tours
const createTour = asyncHandler(async (req, res) => {
  const body = normalizeTourBody(req.body);
  if (!body.slug && body.name) {
    body.slug = slugify(body.name, { lower: true, locale: 'vi' });
  }
  if (!body.slots && Array.isArray(body.startDates) && body.startDates.length) {
    body.slots = syncSlots(body.startDates, [], Number(body.maxGroupSize) || 0);
  }
  const tour = await Tour.create(body);
  res.status(201).json({ data: tour });
});

// PUT /api/tours/:id
const updateTour = asyncHandler(async (req, res) => {
  const body = normalizeTourBody(req.body);
  if (Array.isArray(body.startDates) && !body.slots) {
    const current = await Tour.findById(req.params.id).select('slots maxGroupSize');
    if (current) {
      body.slots = syncSlots(body.startDates, current.slots, Number(body.maxGroupSize ?? current.maxGroupSize) || 0);
    }
  }
  const tour = await Tour.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!tour) {
    res.status(404);
    throw new Error('Không tìm thấy tour');
  }
  res.json({ data: tour });
});

// DELETE /api/tours/:id
const deleteTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    res.status(404);
    throw new Error('Không tìm thấy tour');
  }
  res.json({ data: { message: 'Đã xoá tour' } });
});

// Slot theo từng ngày khởi hành: { dateIso, capacity, reserved, available, status }
const computeSlots = (tour) => {
  const dates = (tour.startDates && tour.startDates.length ? tour.startDates : tour.startDate ? [tour.startDate] : []).map(dayOf);
  const capacityDefault = Number(tour.maxGroupSize) || 0;
  return dates.map((dateIso) => {
    const slot = (tour.slots || []).find((s) => dayOf(s.date) === dateIso);
    const capacity = capacityDefault || (slot ? Number(slot.seatsAvailable) || 0 : 0);
    const reserved = slot ? Number(slot.seatsBooked) || 0 : 0;
    const available = Math.max(capacity - reserved, 0);
    return { dateIso, capacity, reserved, available, status: available <= 0 && capacity > 0 ? 'soldout' : slot?.status || 'open' };
  });
};

// GET /api/tours/:id/slots  -> { slots: [...], data: <slots gốc> }
const getTourSlots = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    res.status(404);
    throw new Error('Không tìm thấy tour');
  }
  res.json({ slots: computeSlots(tour), data: tour.slots || [] });
});

// GET /api/tours/:id/slots/:dateIso  -> { slot: {...} }
const getTourSlotByDate = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    res.status(404);
    throw new Error('Không tìm thấy tour');
  }
  const slot = computeSlots(tour).find((s) => s.dateIso === dayOf(req.params.dateIso));
  if (!slot) {
    res.status(404);
    throw new Error('Không có lịch khởi hành cho ngày này');
  }
  res.json({ slot, data: { slot } });
});

// POST /api/tours/:id/slots
const addTourSlot = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    res.status(404);
    throw new Error('Không tìm thấy tour');
  }
  tour.slots.push(req.body);
  await tour.save();
  res.status(201).json({ data: tour.slots });
});

// POST /api/tours/batch { slugs: [...] } -> mảng tour đúng thứ tự (null nếu không có)
const getToursBatch = asyncHandler(async (req, res) => {
  const { slugs } = req.body;
  if (!Array.isArray(slugs) || !slugs.length) return res.json({ data: [] });
  const tours = await Tour.find({ slug: { $in: slugs } });
  const bySlug = {};
  tours.forEach((t) => { bySlug[t.slug] = t; });
  res.json({ data: slugs.map((x) => bySlug[x] || null) });
});

module.exports = {
  listToursAdmin,
  getToursBatch,
  listTours,
  getTourBySlug,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  getTourSlots,
  getTourSlotByDate,
  addTourSlot,
};
