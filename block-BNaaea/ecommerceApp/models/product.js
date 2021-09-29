const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let productSchema = new Schema(
  {
    name: { type: String, required: true },
    quantity: Number,
    price: Number,
    image: { type: String, required: true },
    likes: Number,
    category: { type: [String], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);