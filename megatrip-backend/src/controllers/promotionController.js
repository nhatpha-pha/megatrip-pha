const asyncHandler = require('express-async-handler');
const Promotion = require('../models/Promotion');

// GET /api/promotions
const listPromotions = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 10, status, appliesTo, type } = req.query;
  const filter = {};
  if (status === 'active') filter.active = true;
  if (status === 'inactive') filter.active = false;
  if (appliesTo) filter.appliesTo = appliesTo;
  if (type) filter.type = type;
  const total = await Promotion.countDocuments(filter);
  const data = await Promotion.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  res.json({ data, pagination: { total, current: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/promotions/:id
const getPromotionById = asyncHandler(async (req, res) => {
  const promo = await Promotion.findById(req.params.id);
  if (!promo) {
    res.status(404);
    throw new Error('Không tìm thấy mã khuyến mãi');
  }
  res.json(promo);
});

// POST /api/promotions
const createPromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.create(req.body);
  res.status(201).json(promo);
});

// PUT /api/promotions/:id
const updatePromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!promo) {
    res.status(404);
    throw new Error('Không tìm thấy mã khuyến mãi');
  }
  res.json(promo);
});

// DELETE /api/promotions/:id
const deletePromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.findByIdAndDelete(req.params.id);
  if (!promo) {
    res.status(404);
    throw new Error('Không tìm thấy mã khuyến mãi');
  }
  res.json({ message: 'Đã xoá mã khuyến mãi' });
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
  res.json({ valid: true, promotion: promo, discountAmount });
});

module.exports = {
  listPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromotion,
};
