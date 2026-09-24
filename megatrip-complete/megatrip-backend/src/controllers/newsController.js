const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const News = require('../models/News');

// GET /api/admin/news
const listNews = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 6, status, category, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) filter.title = { $regex: search, $options: 'i' };
  const total = await News.countDocuments(filter);
  const data = await News.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  res.json({ data, pagination: { total, current: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/admin/news/:id
const getNewsById = asyncHandler(async (req, res) => {
  const article = await News.findById(req.params.id);
  if (!article) {
    res.status(404);
    throw new Error('Không tìm thấy bài viết');
  }
  res.json(article);
});

// GET /api/news/slug/:slug (public)
const getNewsBySlug = asyncHandler(async (req, res) => {
  const article = await News.findOne({ slug: req.params.slug, status: 'published' });
  if (!article) {
    res.status(404);
    throw new Error('Không tìm thấy bài viết');
  }
  res.json(article);
});

// POST /api/admin/news
const createNews = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!body.slug && body.title) body.slug = slugify(body.title, { lower: true, locale: 'vi' });
  if (body.status === 'published' && !body.publishedAt) body.publishedAt = new Date();
  const article = await News.create(body);
  res.status(201).json(article);
});

// PUT /api/admin/news/:id
const updateNews = asyncHandler(async (req, res) => {
  const body = req.body;
  if (body.status === 'published' && !body.publishedAt) body.publishedAt = new Date();
  const article = await News.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!article) {
    res.status(404);
    throw new Error('Không tìm thấy bài viết');
  }
  res.json(article);
});

// DELETE /api/admin/news/:id
const deleteNews = asyncHandler(async (req, res) => {
  const article = await News.findByIdAndDelete(req.params.id);
  if (!article) {
    res.status(404);
    throw new Error('Không tìm thấy bài viết');
  }
  res.json({ message: 'Đã xoá bài viết' });
});

module.exports = { listNews, getNewsById, getNewsBySlug, createNews, updateNews, deleteNews };
