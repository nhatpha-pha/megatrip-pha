const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: String,
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived', 'unpublished'],
      default: 'draft',
    },
    author: {
      id: String,
      name: String,
      avatar: String,
    },
    summary: String,
    content: String,
    featured: { type: Boolean, default: false },
    heroImage: String,
    publishedAt: Date,
  },
  { timestamps: true }
);

newsSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('News', newsSchema);
