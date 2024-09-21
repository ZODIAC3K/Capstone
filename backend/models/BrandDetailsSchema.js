const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
	brand_name: { type: String, required: true },
	image: { type: mongoose.Schema.Types.ObjectId, ref: "ImageDetail" },
	created_at: { type: Date, default: Date.now() },
});

const BrandDetails = mongoose.model("Brand", brandSchema);

module.exports = { BrandDetails, brandSchema };
