const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  discount: Number,
  title: String,
  description: String,
  created_at: { type: Date, default: Date.now() },
  end_at: { type: Date, required: true },
  modified_at: { type: Date, default: Date.now() },
});


const CouponDetails = mongoose.model('Coupon', couponSchema);

module.exports = {CouponDetails, couponSchema};
