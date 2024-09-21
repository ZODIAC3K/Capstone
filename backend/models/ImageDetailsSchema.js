const mongoose = require('mongoose');

const imageDetailSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  content_type: { type: String, required: true },
});

const ImageDetails = mongoose.model('ImageDetail', imageDetailSchema);

module.exports = ImageDetails;
