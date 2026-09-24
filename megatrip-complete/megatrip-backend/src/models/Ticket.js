const mongoose = require('mongoose');

const ticketResponseSchema = new mongoose.Schema(
  {
    content: String,
    isInternal: { type: Boolean, default: false },
    authorId: String,
    authorName: String,
    authorType: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    attachments: [String],
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: String,
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: String,
    customerEmail: String,
    customerAvatar: String,
    category: {
      type: String,
      enum: ['technical', 'billing', 'account', 'general', 'complaint', 'cancel'],
      default: 'general',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['new', 'open', 'pending', 'resolved', 'closed'], default: 'new' },
    assignedTo: String,
    assignedToName: String,
    tags: [String],
    closedAt: Date,
    responses: [ticketResponseSchema],
  },
  { timestamps: true }
);

ticketSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Ticket', ticketSchema);
