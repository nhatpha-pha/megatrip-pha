const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busCode: { type: String, required: true, unique: true },
    operator: {
      id: String,
      name: String,
      logo: String,
      code: String,
    },
    routeFrom: { code: String, name: String, city: String },
    routeTo: { code: String, name: String, city: String },
    departureAt: String,
    arrivalAt: String,
    departureDates: [String],
    arrivalDates: [String],
    duration: String,
    busType: [String],
    adultPrice: { type: Number, default: 0 },
    childPrice: { type: Number, default: 0 },
    seatsTotal: { type: Number, default: 0 },
    seatsBooked: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'hidden', 'draft'], default: 'active' },
    pickupPoints: [String],
    dropoffPoints: [String],
    amenities: [String],
    images: [String],
    slots: [
      {
        date: String,
        seatMap: [{ seatNumber: String, status: { type: String, enum: ['available', 'booked', 'locked'], default: 'available' } }],
      },
    ],
  },
  { timestamps: true }
);

busSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Bus', busSchema);
