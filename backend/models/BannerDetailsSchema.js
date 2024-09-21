const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  type: {
    type: String,
    required: true
  },
  applicable_product: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  image: { type: mongoose.Schema.Types.ObjectId, ref: 'ImageDetail' },
});
const BannerDetails = mongoose.model('Banner', bannerSchema);

module.exports = {BannerDetails, bannerSchema};
