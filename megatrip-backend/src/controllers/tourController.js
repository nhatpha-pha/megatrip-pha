const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const Tour = require('../models/Tour');

const buildFilter = (query) => {
  const { search, status, categoryId, difficulty } = query;
  const filter = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
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

// POST /api/tours
const createTour = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!body.slug && body.name) {
    body.slug = slugify(body.name, { lower: true, locale: 'vi' });
  }
  const tour = await Tour.create(body);
  res.status(201).json({ data: tour });
});

// PUT /api/tours/:id
const updateTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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

// GET /api/tours/:id/slots
const getTourSlots = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    res.status(404);
    throw new Error('Không tìm thấy tour');
  }
  res.json({ data: tour.slots || [] });
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

module.exports = {
  listTours,
  getTourBySlug,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  getTourSlots,
  addTourSlot,
};
