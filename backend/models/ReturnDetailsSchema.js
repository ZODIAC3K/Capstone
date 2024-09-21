const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  order_details_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  req_type: String,
  status: String,
  created_at: { type: Date, default: Date.now() },
  modified_at: { type: Date, default: Date.now() },
});
const ReturnDetails = mongoose.model('Return', returnSchema);

module.exports = {ReturnDetails, returnSchema};
