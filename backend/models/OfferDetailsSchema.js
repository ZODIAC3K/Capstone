const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  offer_discount: Number,
  title: String,
  description: String,
  applicable_on: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product'}],
  created_at: { type: Date, default: Date.now() },
  end_at: { type: Date, required: true},
  modified_at: { type: Date, default: Date.now() },
});

const OfferDetails = mongoose.model('Offer', offerSchema);

module.exports = {OfferDetails, offerSchema};
