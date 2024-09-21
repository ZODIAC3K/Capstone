// Import the mongoose library
const mongoose = require('mongoose');

const modificationTrackingDetailsSchema = new mongoose.Schema({
  modification_tracking_id: { type: String, required: true },
  modification_type: { type: String, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "OrderDetails" }
});

const ModificationTrackingDetails = mongoose.model('ModificationTrackingDetails', modificationTrackingDetailsSchema);

module.exports = {ModificationTrackingDetails, modificationTrackingDetailsSchema};
