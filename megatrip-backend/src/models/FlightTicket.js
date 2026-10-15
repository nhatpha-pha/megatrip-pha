const mongoose = require('mongoose');

// Vé máy bay đã đặt (khác với "Ticket hỗ trợ" ở Ticket.js) — dùng để khớp ghế khi đổi lịch bay.
const flightTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uniq: String,
    status: { type: String, enum: ['pending', 'paid', 'changed', 'cancelled'], default: 'pending' },
    seats: [String],
    reservationInfo: {
      flights: { outbound: mongoose.Schema.Types.Mixed, inbound: mongoose.Schema.Types.Mixed },
    },
    pricing: {
      total: Number,
      seats: [{ leg: { type: String, enum: ['outbound', 'inbound'] }, number: String }],
    },
  },
  { timestamps: true }
);
flightTicketSchema.set('toJSON', {
  virtuals: true,
  transform: (_d, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; },
});
module.exports = mongoose.model('FlightTicket', flightTicketSchema);
