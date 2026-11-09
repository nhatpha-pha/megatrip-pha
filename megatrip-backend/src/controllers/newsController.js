const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const News = require('../models/News');
const { clean, escapeRegex, paging, parseIds } = require('../utils/listQuery');

// GET /api/admin/news  (nhận cả limit/pageSize, q/search; bỏ qua bộ lọc "all")
const listNews = asyncHandler(async (req, res) => {
  const { page, pageSize } = paging(req.query, 6);
  const status = clean(req.query.status);
  const category = clean(req.query.category);
  const search = clean(req.query.search ?? req.query.q);
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
  const total = await News.countDocuments(filter);
  const data = await News.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  res.json({ data, pagination: { total, current: page, pageSize } });
});

// POST /api/admin/news/bulk  { action: 'publish' | 'unpublish' | 'archive' | 'delete', ids: [] }
const bulkNews = asyncHandler(async (req, res) => {
  const ids = parseIds(req.body);
  const { action } = req.body || {};
  if (!ids.length) {
    res.status(400);
    throw new Error('Chưa chọn bài viết nào');
  }
  let result;
  if (action === 'publish') result = await News.updateMany({ _id: { $in: ids } }, { $set: { status: 'published', publishedAt: new Date() } });
  else if (action === 'unpublish') result = await News.updateMany({ _id: { $in: ids } }, { $set: { status: 'unpublished' } });
  else if (action === 'archive') result = await News.updateMany({ _id: { $in: ids } }, { $set: { status: 'archived' } });
  else if (action === 'delete') result = await News.deleteMany({ _id: { $in: ids } });
  else {
    res.status(400);
    throw new Error('Thao tác không hợp lệ');
  }
  res.json({ data: { action, affected: result.modifiedCount ?? result.deletedCount ?? 0 } });
});

// GET /api/admin/news/:id
const getNewsById = asyncHandler(async (req, res) => {
  const article = await News.findById(req.params.id);
  if (!article) {
    res.status(404);
    throw new Error('Không tìm thấy bài viết');
  }
  res.json({ data: article });
});

// GET /api/news/slug/:slug (public)
const getNewsBySlug = asyncHandler(async (req, res) => {
  const article = await News.findOne({ slug: req.params.slug, status: 'published' });
  if (!article) {
    res.status(404);
    throw new Error('Không tìm thấy bài viết');
  }
  res.json({ data: article });
});

// POST /api/admin/news
const createNews = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!body.slug && body.title) body.slug = slugify(body.title, { lower: true, locale: 'vi' });
  if (body.status === 'published' && !body.publishedAt) body.publishedAt = new Date();
  const article = await News.create(body);
  res.status(201).json({ data: article });
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
  res.json({ data: article });
});

// DELETE /api/admin/news/:id
const deleteNews = asyncHandler(async (req, res) => {
  const article = await News.findByIdAndDelete(req.params.id);
  if (!article) {
    res.status(404);
    throw new Error('Không tìm thấy bài viết');
  }
  res.json({ data: { message: 'Đã xoá bài viết' } });
});

module.exports = { listNews, bulkNews, getNewsById, getNewsBySlug, createNews, updateNews, deleteNews };
