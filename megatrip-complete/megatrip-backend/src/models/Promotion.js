const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: String,
    description: String,
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, default: 0 },
    minSpend: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    appliesTo: [{ type: String, enum: ['tours', 'flights', 'buses'] }],
    validFrom: Date,
    validTo: Date,
    active: { type: Boolean, default: true },
    requireCode: { type: Boolean, default: true },
    autoApply: { type: Boolean, default: false },
  },
  { timestamps: true }
);

promotionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Promotion', promotionSchema);
