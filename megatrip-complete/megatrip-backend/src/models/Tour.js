const mongoose = require('mongoose');

const itineraryDaySchema = new mongoose.Schema(
  { dayNumber: Number, title: String, details: String },
  { _id: false }
);

const tourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    departureFrom: { type: String, default: '' },
    destination: { type: String, default: '' },
    startDate: { type: String },
    endDate: { type: String },
    startDates: [String],
    endDates: [String],
    duration: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'difficult'], default: 'easy' },
    adultPrice: { type: Number, required: true, default: 0 },
    childPrice: { type: Number, default: 0 },
    infantPrice: { type: Number, default: 0 },
    maxGroupSize: { type: Number, default: 0 },
    seatsBooked: { type: Number, default: 0 },
    minBooking: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'hidden', 'draft'], default: 'draft' },
    highlight: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    categoryId: { type: String, default: '' },
    tags: [String],
    images: [String],
    videoUrl: { type: String, default: '' },
    itinerary: [itineraryDaySchema],
    services: [String],
    pickupPoints: [String],
    startLocation: {
      type: { type: String, default: 'Point' },
      address: String,
      pickupDropoff: String,
    },
    cancellationPolicy: { type: String, default: '' },
    slots: [
      {
        date: String,
        seatsAvailable: Number,
        seatsBooked: { type: Number, default: 0 },
        status: { type: String, enum: ['open', 'closed', 'full'], default: 'open' },
      },
    ],
  },
  { timestamps: true }
);

tourSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Tour', tourSchema);
