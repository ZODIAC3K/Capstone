// Import any necessary models or modules
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = require("../config");
const { Transaction } = require("../models");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const {
	OrderDetails,
	stockDetail,
	CouponDetails,
	OfferDetails,
} = require("../models");

// Function to get all orders
async function getAllOrders(req, res, next) {
	try {
		const orders = await OrderDetails.find();
		res.status(200).json(orders);
	} catch (error) {
		res.status(500).json({ message: error.message });
		next(error);
	}
}

// Function to create a new order and update the stock of the product ordered
// using aggrigation pipeline. (lookup etc...) ==============================
async function verifyOrderAndCreation_mongodb(req, res, next) {
	// verifies the order that the contents of the order is legit or not
	let {
		user_id,
		product_ordered, // array of product id's
		color,
		size_ordered,
		quantity_ordered,
		coupon_used,
		offer_used,
		total_amount,
		address,
	} = req.body;

	var product_ordered_amount = 0;
	var each_product_amount = 0;
	var final_amount = 0;

	// console.log(req.body);

	try {
		// if address field is empty check if the user has a default address or not and if not return error
		if (total_amount < 0) {
			return res.status(400).json({ message: "Invalid Amount" });
		} else if (!address) {
			return res.status(400).json({ message: "Address is required" });
		}

		// traverse through the product_ordered array and check if the product is in stock
		// if not in stock then return error message
		// if in stock then update the stock of the product
		// if the product is in stock then create the order

		product_ordered = product_ordered.split(",");
		size_ordered = size_ordered.split(",");
		color = color.split(",");
		quantity_ordered = quantity_ordered.split(",");
		// coupon_used = coupon_used.split(","); // on over all order.
		offer_used = offer_used.split(","); // on each product.

		const Errors = [];

		product_ordered.forEach((product_id, idx) => {
			// console.log(size_ordered[idx].toUpperCase(), color[idx].toUpperCase());
			// console.log(product_id);
			stockDetail
				.findOne({
					product_id: product_id,
					size: size_ordered[idx].toUpperCase(),
					color: color[idx].toUpperCase(),
				})
				.then(async (stock_details) => {
					// console.log(stock_details);
					if (stock_details.length == 0) {
						Errors.push({
							product: product_id,
							message: "Invalid Product",
							status: false,
						});
					}
					if (stock_details.quantity < quantity_ordered[idx]) {
						Errors.push({
							product: product_id,
							message: "Product is out of stock",
							status: false,
						});
					}
					if (
						offer_used[idx] !== "null" &&
						offer_used[idx] !== undefined
					) {
						// console.log(offer_used[idx]);
						OfferDetails.find(offer_used[idx]).then((offer) => {
							if (!offer) {
								Errors.push({
									offer_used: offer_used[idx],
									message: "Offer not found",
									status: false,
								});
							} else {
								if (offer.applicable_on.includes(product_id)) {
									if (offer.end_at < Date.now()) {
										Errors.push({
											offer_used: offer_used[idx],
											message: "Offer is expired",
											status: false,
										});
									} else {
										each_product_amount =
											stock_details.amount -
											stock_details.amount *
												(offer.offer_discount / 100); // amount - (amount * offer_discount/100)
										product_ordered_amount =
											each_product_amount *
											parseInt(quantity_ordered[idx]); //  (quantity * amount)
										final_amount += product_ordered_amount; // total amount after applying offer on each product
									}
								} else {
									Errors.push({
										offer_used: offer_used[idx],
										message:
											"Offer is not applicable on this product",
										status: false,
									});
								}
							}
						});
					} else {
						each_product_amount = stock_details.amount;
						product_ordered_amount =
							each_product_amount *
							parseInt(quantity_ordered[idx]);
						final_amount += product_ordered_amount; // total amount after applying offer on each product
					}
				})
				.catch((err) => {
					Errors.push({
						product: product_id,
						message: "Invalid Product",
						status: false,
					});
				});
		});

		if (coupon_used) {
			CouponDetails.findById(coupon_used).then(async (coupon_used) => {
				if (coupon_used) {
					if (coupon_used.end_at < Date.now()) {
						Errors.push({
							coupon_used: coupon_used,
							message: "Coupon is expired",
							status: false,
						});
					} else {
						final_amount =
							final_amount -
							(final_amount * coupon_used.discount) / 100; // final_amount - (final_amount * coupon_discount/100)
					}
				}
			});
		}

		total_amount = final_amount;

		// after applying offer on each product and coupon on over all order if the total amount is less than 0 then set it to 1 rupee
		if (total_amount < 0 || total_amount == 0) {
			total_amount = 1;
		}

		const createOrder = new OrderDetails({
			user_id: user_id,
			req_type: "Pending", // [Approved, Rejected, Pending] (Admin) ==> if Rejected then refund the amount using razorpay.
			status: "Processing", // [Placed, Shipped, Delivered, Cancelled] (Admin) ==> if Cancelled then refund the amount using razorpay.
			product_ordered: product_ordered, // array of product id's
			color: color, // array of color corresponding to product id
			size_ordered: size_ordered, // array of size corresponding to product id
			quantity_ordered: quantity_ordered, // array of quantity corresponding to product id
			coupon_used: coupon_used, // on over all order.
			offer_used: offer_used, // on each product.
			total_amount: total_amount, // total amount after applying offer on each product and coupon on over all order
			address: address, // address id
		});

		const userOrder = await createOrder.save(); // save the order in the database with req_type as pending.
		if (Errors.length > 0) {
			return res.status(400).json({
				message: Errors,
				status: false,
			});
		} else {
			return res.status(200).json({
				message: "Order is in processing and verification is done",
				status: true,
				data: userOrder,
			});
		}
	} catch (error) {
		next(error);
	}
}

async function razorpayOrderCreate(req, res, next) {
	var instance = new Razorpay({
		key_id: RAZORPAY_ID_KEY,
		key_secret: RAZORPAY_SECRET_KEY,
	});
	var options = {
		amount: Number(req.body.total_amount * 100), // mendetory -> amount in the smallest currency unit (paise)
		currency: "INR", //mendetory
		notes: {
			user_id: req.body.user_id,
			order_id: req.body.order_id,
		}, // mendetory for database order processing
	};
	instance.orders.create(options, function (err, order) {
		if (err) {
			console.log(err);
			return res.status(400).json({
				message: `Something went wrong`,
				status: false,
			});
		} else {
			return res.status(201).json({
				data: order,
				status: true,
			});
		}
	});
}

async function razorpayPaymentVerificationAndOrderUpdate(req, res, next) {
	const {
		razorpay_payment_id,
		razorpay_order_id,
		razorpay_signature,
		order,
	} = req.body;

	const product_ordered = Object.values(order.product_ordered);

	const check = razorpay_order_id + "|" + razorpay_payment_id;

	const expectedSignature = crypto
		.createHmac("sha256", RAZORPAY_SECRET_KEY)
		.update(check.toString())
		.digest("hex");
	console.log(expectedSignature === razorpay_signature);
	if (expectedSignature !== razorpay_signature) {
		return res.status(400).json({
			message: "Invalid Payment",
			status: false,
		});
	} else {
		// save the transaction details in the database
		const transaction = new Transaction({
			user_id: order.user_id,
			order_id: order.order_id,
			razorpay_payment_id: razorpay_payment_id,
			razorpay_order_id: razorpay_order_id,
			razorpay_signature: razorpay_signature,
		});
		await transaction.save().then((transaction) => {
			console.log(transaction);
		});
		const updateOrder = await OrderDetails.findByIdAndUpdate(
			order.order_id,
			{
				status: "Placed",
				transcation_id: transaction._id,
			},
			{ new: true } // to return the updated document instead of old one
		);
		let Errors = [];
		product_ordered.forEach((product_id, idx) => {
			stockDetail
				.findOne({
					product_id: product_id,
					size: order.size_ordered[idx].toUpperCase(),
					color: order.color[idx].toUpperCase(),
				})
				.then(async (stock_details) => {
					if (!stock_details) {
						Errors.push({
							product: product_id,
							message: "Invalid Product",
							status: false,
						});
					} else {
						stock_details.quantity =
							stock_details.quantity -
							order.quantity_ordered[idx];
						stock_details.save();
					}
				});
		});
		if (Errors.length > 0) {
			return res.status(400).json({
				message: Errors,
				status: false,
			});
		} else {
			// updateOrder is getting null result --- fix required
			return res.status(200).json({
				message: "Payment is successfull and order is placed",
				status: true,
				data: updateOrder,
			});
		}
	}
}

// Function to get a single order by ID
async function getOrderById(req, res, next) {
	try {
		const order = await OrderDetails.findById(req.params.id);
		res.status(200).json(order);
	} catch (error) {
		res.status(404).json({ message: error.message });
		next(error);
	}
}

// Function to update an existing order
async function updateOrder(req, res) {
	// make sure order is not in shipping or delivered state or approved or rejected state ======= FIX REQUIRED!!!!!!!!!!!!
	try {
		const updatedOrder = await OrderDetails.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		);
		res.status(200).json(updatedOrder);
	} catch (error) {
		res.status(400).json({ message: error.message });
		next(error);
	}
}

// Function to delete an existing order
async function deleteOrder(req, res) {
	try {
		await OrderDetails.findByIdAndDelete(req.params.id);
		res.status(200).json({ message: "Order deleted successfully" });
	} catch (error) {
		res.status(400).json({ message: error.message });
		next(error);
	}
}

// Export the controller functions
module.exports = {
	deleteOrder,
	updateOrder,
	getOrderById,
	getAllOrders,
	verifyOrderAndCreation_mongodb,
	razorpayOrderCreate,
	razorpayPaymentVerificationAndOrderUpdate,
};
