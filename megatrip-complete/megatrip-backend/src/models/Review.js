const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    productId: { type: mongoose.Schema.Types.ObjectId },
    productType: { type: String, enum: ['tour', 'bus', 'flight'], default: 'tour' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    isVisible: { type: Boolean, default: true },
    serviceName: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
