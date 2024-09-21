const mongoose = require('mongoose');

const productReviewSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  rating: { type: Number, required: true },
  image_details_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ImageDetail' }],
});

const ProductReviewDetails = mongoose.model('ProductReview', productReviewSchema);

module.exports = {ProductReviewDetails, productReviewSchema};
