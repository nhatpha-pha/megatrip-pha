const asyncHandler = require('express-async-handler');
const Promotion = require('../models/Promotion');
const { clean, escapeRegex, paging, parseIds } = require('../utils/listQuery');

// GET /api/promotions  (bỏ qua các bộ lọc "all")
const listPromotions = asyncHandler(async (req, res) => {
  const { page, pageSize } = paging(req.query, 10);
  const status = clean(req.query.status);
  const appliesTo = clean(req.query.appliesTo);
  const type = clean(req.query.type);
  const search = clean(req.query.search ?? req.query.q);
  const filter = {};
  if (status === 'active') filter.active = true;
  if (status === 'inactive') filter.active = false;
  if (appliesTo) filter.appliesTo = appliesTo;
  if (type) filter.type = type;
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ code: rx }, { title: rx }, { description: rx }];
  }
  const total = await Promotion.countDocuments(filter);
  const data = await Promotion.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  res.json({ data, pagination: { total, current: page, pageSize } });
});

// POST /api/promotions/bulk  { action: 'activate' | 'deactivate' | 'delete', ids: [] }
const bulkPromotions = asyncHandler(async (req, res) => {
  const ids = parseIds(req.body);
  const { action } = req.body || {};
  if (!ids.length) {
    res.status(400);
    throw new Error('Chưa chọn khuyến mãi nào');
  }
  let result;
  if (action === 'activate') result = await Promotion.updateMany({ _id: { $in: ids } }, { $set: { active: true } });
  else if (action === 'deactivate') result = await Promotion.updateMany({ _id: { $in: ids } }, { $set: { active: false } });
  else if (action === 'delete') result = await Promotion.deleteMany({ _id: { $in: ids } });
  else {
    res.status(400);
    throw new Error('Thao tác không hợp lệ');
  }
  res.json({ data: { action, affected: result.modifiedCount ?? result.deletedCount ?? 0 } });
});

// GET /api/promotions/:id
const getPromotionById = asyncHandler(async (req, res) => {
  const promo = await Promotion.findById(req.params.id);
  if (!promo) {
    res.status(404);
    throw new Error('Không tìm thấy mã khuyến mãi');
  }
  res.json({ data: promo });
});

// POST /api/promotions
const createPromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.create(req.body);
  res.status(201).json({ data: promo });
});

// PUT /api/promotions/:id
const updatePromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!promo) {
    res.status(404);
    throw new Error('Không tìm thấy mã khuyến mãi');
  }
  res.json({ data: promo });
});

// DELETE /api/promotions/:id
const deletePromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.findByIdAndDelete(req.params.id);
  if (!promo) {
    res.status(404);
    throw new Error('Không tìm thấy mã khuyến mãi');
  }
  res.json({ data: { message: 'Đã xoá mã khuyến mãi' } });
});

// POST /api/promotions/validate  { code, appliesTo, orderTotal }
const validatePromotion = asyncHandler(async (req, res) => {
  const { code, appliesTo, orderTotal = 0 } = req.body;
  const promo = await Promotion.findOne({ code: code?.toUpperCase(), active: true });
  if (!promo) {
    res.status(404);
    throw new Error('Mã khuyến mãi không tồn tại hoặc đã ngừng hoạt động');
  }
  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) {
    res.status(400);
    throw new Error('Mã khuyến mãi chưa bắt đầu hiệu lực');
  }
  if (promo.validTo && now > promo.validTo) {
    res.status(400);
    throw new Error('Mã khuyến mãi đã hết hạn');
  }
  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    res.status(400);
    throw new Error('Mã khuyến mãi đã hết lượt sử dụng');
  }
  if (appliesTo && promo.appliesTo.length && !promo.appliesTo.includes(appliesTo)) {
    res.status(400);
    throw new Error('Mã khuyến mãi không áp dụng cho loại dịch vụ này');
  }
  if (promo.minSpend && orderTotal < promo.minSpend) {
    res.status(400);
    throw new Error(`Đơn hàng tối thiểu ${promo.minSpend.toLocaleString('vi-VN')}đ để áp dụng mã này`);
  }
  const discountAmount = promo.type === 'percent' ? Math.round((orderTotal * promo.value) / 100) : promo.value;
  res.json({ data: { valid: true, promotion: promo, discountAmount } });
});

module.exports = {
  listPromotions,
  bulkPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromotion,
};
