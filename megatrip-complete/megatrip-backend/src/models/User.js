const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    dob: { type: String, default: '' },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.otpCode;
    delete ret.otpExpires;
    delete ret.resetToken;
    delete ret.resetTokenExpires;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
