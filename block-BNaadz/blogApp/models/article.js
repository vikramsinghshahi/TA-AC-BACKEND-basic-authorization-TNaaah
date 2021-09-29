
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('slug');

let articleSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    description: String,
    likes: { type: Number, default: 0 },
    comments: { type: [Schema.Types.ObjectId], ref: 'Comment' },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    slug: String,
  },
  { timestamps: true }
);

articleSchema.pre('save', function (next) {
  this.slug = slug(this.title);
  next();
});

module.exports = mongoose.model('Article', articleSchema);