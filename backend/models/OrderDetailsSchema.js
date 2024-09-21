const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	req_type: {type: String, default: "Pending"}, // [Approved, Rejected, Pending] (Admin) ==> if Rejected then refund the amount using razorpay.
	// if status is failed req_type will be rejected and if status is success req_type will be Approved.
	status: {type : String, default: "Processing"}, // [Placed, Shipped, Delivered, Cancelled, Failed] (Admin) ==> if Cancelled then refund the amount using razorpay.
	// if payment is failed status will be failed and payment is success then status will be placed.
	product_ordered: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
	color: [String],
	size_ordered: [String],
	quantity_ordered: [Number],
	coupon_used: { type: mongoose.Schema.Types.Mixed, ref: "Coupon" }, // on over all order.
	offer_used: [{ type: mongoose.Schema.Types.Mixed, ref: "Offer" }], // on each product.
	total_amount: Number,
	address: {type: mongoose.Schema.Types.ObjectId, ref: "Address"},
	created_at: { type: Date, default: Date.now() },
	modified_at: { type: Date, default: Date.now() },
	transcation_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Transaction',
	},
});

const OrderDetails = mongoose.model("Order", orderSchema);

module.exports = {OrderDetails, orderSchema};
