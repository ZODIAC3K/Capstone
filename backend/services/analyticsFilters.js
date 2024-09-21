const { ReturnDetails, Product, OrderDetails } = require("../models");

const moment = require('moment');

/**
 * Get orders placed based on a time filter and return them as (x, y) coordinate arrays.
 *
 * This function retrieves order data within a specified time filter (day, week, month, or year) and formats
 * it as an array of (x, y) coordinate objects, where 'x' represents the timestamp and 'y' represents the number
 * of orders placed at that timestamp.
 *
 * @param {string} filter - The time filter (day, week, month, year).
 *
 * @returns {Array<Object>} An array of (x, y) coordinate objects with timestamps and order counts.
 * 
 * Example of the returned data:
 * [
 *   { x: 1668175200000, y: 10 }, // Example timestamp (x) and number of orders (y)
 *   { x: 1668186000000, y: 15 },
 *   { x: 1668196800000, y: 18 },
 *   // ... more data points for the specified time filter
 * ]
 *
 * @throws {Error} If there's an error during data retrieval or processing.
 */
async function getOrdersBasedOnTimeFilter(filter) {
  // Define the time filter values in milliseconds.
  const timeFilters = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  // Calculate the start timestamp based on the filter.
  const startTime = Date.now() - timeFilters[filter];

  try {
    // Use MongoDB aggregation to group and count orders based on the timestamp.
    const result = await OrderDetails.aggregate([
      {
        $match: {
          created_at: { $gte: new Date(startTime) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format the result as (x, y) coordinate arrays.
    const dataPoints = result.map((item) => ({
      x: moment(item._id).valueOf(), // Convert date to timestamp.
      y: item.count,
    }));

    return dataPoints;
  } catch (error) {
    // Handle any errors here.
    console.error('An error occurred:', error);
    return null;
  }
}

/**
 * Get the total amount of money spent on returns by summing the 'total_amount' from related orders.
 * @returns {Promise<number>} The total amount spent on returns.
 */
async function getTotalAmountSpentOnReturns() {
	const result = await ReturnDetails.aggregate([
		{
			$lookup: {
				from: "orderdetails", // Adjust the collection name if it's different
				localField: "order_details_id",
				foreignField: "_id",
				as: "order",
			},
		},
		{
			$unwind: "$order",
		},
		{
			$group: {
				_id: null,
				totalAmount: { $sum: "$order.total_amount" },
			},
		},
	]);

	// If there are no returns, return 0, otherwise return the total amount spent on returns.
	return result.length > 0 ? result[0].totalAmount : 0;
}

/**
 * Get the total number of products.
 * @returns {Promise<number>} The total number of products.
 */
async function getTotalProductCount() {
	const count = await Product.countDocuments();
	return count;
}

/**
 * Get the products with the highest quantity ordered.
 * @returns {Promise<Array<Object>|null>} An array of 10 products with their total sold quantities.
 */
async function getHighestSoldProducts() {
	const products = await OrderDetails.aggregate([
		{ $unwind: "$product_ordered" },
		{
			$group: {
				_id: "$product_ordered",
				totalSold: { $sum: "$quantity_ordered" },
			},
		},
		{ $sort: { totalSold: -1 } },
		{ $limit: 10 },
	]);
	return products;
}

/**
 * Get the product with the highest average rating.
 * @returns {Promise<Array<Object>|null>} The product with the highest average rating or null if no products are found.
 */
async function getHighestRatedProducts() {
	const product = await Product.aggregate([
		{ $unwind: "$stock_details" },
		{
			$lookup: {
				from: "productreviews",
				localField: "stock_details._id",
				foreignField: "product_id",
				as: "reviews",
			},
		},
		{
			$addFields: {
				avgRating: { $avg: "$reviews.rating" },
			},
		},
		{ $sort: { avgRating: -1 } },
		{ $limit: 10 },
	]);
	return product || null;
}

/**
 * Get the category with the most products sold.
 * @returns {Promise<Object|null>} The category with the most products sold or null if no categories are found.
 */
async function getMostSoldCategory() {
	const category = await Product.aggregate([
		{ $unwind: "$category" },
		{
			$group: {
				_id: "$category",
				totalSold: { $sum: 1 },
			},
		},
		{ $sort: { totalSold: -1 } },
		{ $limit: 1 },
	]);
	return category[0] || null;
}

/**
 * Get the brand with the most products sold.
 * @returns {Promise<Object|null>} The brand with the most products sold or null if no brands are found.
 */
async function getMostSoldBrand() {
	const brand = await Product.aggregate([
		{ $unwind: "$brand" },
		{
			$group: {
				_id: "$brand",
				totalSold: { $sum: 1 },
			},
		},
		{ $sort: { totalSold: -1 } },
		{ $limit: 1 },
	]);
	return brand[0] || null;
}

/**
 * Get the total number of orders.
 * @returns {Promise<number>} The total number of orders.
 */
async function getTotalOrderCount() {
	const count = await OrderDetails.countDocuments();
	return count;
}

/**
 * Get orders based on the 'req_type'.
 * @param {string} reqType - The request type ('Pending', 'Accepted', or 'Rejected').
 * @returns {Promise<Array>} An array of orders matching the request type.
 */
async function getOrdersByReqType(reqType) {
	const orders = await OrderDetails.find({ req_type: reqType });
	return orders;
}

/**
 * Get the total number of returned orders.
 * @returns {Promise<number>} The total number of returned orders.
 */
async function getTotalReturnedOrderCount() {
	const count = await ReturnDetails.countDocuments();
	return count;
}

/**
 * Get the total amount of money gained on orders by summing 'total_amount' of delivered orders.
 * @returns {Promise<number>} The total amount gained on orders.
 */
async function getTotalAmountGainedOnOrders() {
	const result = await OrderDetails.aggregate([
		{ $match: { status: "Delivered" } },
		{
			$group: {
				_id: null,
				totalAmount: { $sum: "$total_amount" },
			},
		},
	]);
	return result.length > 0 ? result[0].totalAmount : 0;
}

module.exports = {
	totalProducts: getTotalProductCount,
	totalOrders: getTotalOrderCount,
	totalReturns: getTotalReturnedOrderCount,
	highestSold: getHighestSoldProducts,
	highestRate: getHighestRatedProducts,
	mostBrand: getMostSoldBrand,
	mostCategory: getMostSoldCategory,
	ordersByReq: getOrdersByReqType,
	totalAmountGained: getTotalAmountGainedOnOrders,
	totalAmountSpent: getTotalAmountSpentOnReturns,
	graphData: getOrdersBasedOnTimeFilter,
};
