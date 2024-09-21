const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true },
  pass: { type: Date, required: true }, // Store hashed password
  fname: String,
  lname: String,
  mobile: Number,
  profile_picture: { type: mongoose.Schema.Types.ObjectId, ref: 'ImageDetail' },
  created_at: { type: Date, default: Date.now() },
  modified_at: { type: Date, default: Date.now() },
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = {Admin,adminSchema};
