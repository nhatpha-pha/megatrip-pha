const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    id: String,
    type: { type: String, enum: ['tour', 'flight', 'bus'], required: true },
    name: String,
    sku: String,
    image: String,
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    status: String,
    note: String,
    actor: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    content: String,
    author: String,
    timestamp: { type: Date, default: Date.now },
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    customerAddress: String,
    items: [orderItemSchema],
    subtotal: { type: Number, default: 0 },
    discount: {
      code: String,
      name: String,
      amount: { type: Number, default: 0 },
    },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
    timeline: [timelineEventSchema],
    notes: [noteSchema],
    changeCalendar: { type: Boolean, default: false },
    dateChangeCalendar: String,
  },
  { timestamps: true }
);

orderSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Order', orderSchema);
