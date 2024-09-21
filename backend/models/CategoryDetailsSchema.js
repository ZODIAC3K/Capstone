const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category_name: String,
  created_at: { type: Date, default: Date.now() },
});

const CategoryDetails = mongoose.model('Category', categorySchema);

module.exports = {CategoryDetails, categorySchema};
