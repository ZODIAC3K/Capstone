const {
	Product,
	productDetailsSchema,
	stockDetail,
	stockDetailSchema,
	ImageDetails,
} = require("../models");
const { populateAllAttributes } = require("../services");
const { insertMultipleImages, updateImage } = require("./imageController");

// GET all products sort by highest rating.
async function fetchProducts(req, res, next) {
	try {
		var { options } = req.body;
		options = options ? options : {};
		options.sortby = options.sortby ? options.sortby : { rating: -1 }; // If not sorting option provided sort by descending rating
		options.limit = options.limit ? parseInt(options.limit) : 10; // If no limit specified then take limit as 10.
		options.skip = options.skip
			? parseInt(options.skip) * parseInt(options.limit)
			: 0; // If no skip / page specified take 0 (start from the first document).

		Product.find()
			.populate("category")
			.populate({
				path: "brand",
				populate: "image",
			})
			.populate({
				path: "stock_details",
				populate: "image",
			})
			.sort(options.sortby)
			.skip(options.skip)
			.limit(options.limit)
			.then(async (products) => {
				res.status(200).json({
					message: "success",
					products,
				});
			})
			.catch((error) => {
				next(error);
				return;
			});
	} catch (error) {
		next(error);
		return;
	}
}

// GET products based of filter.
function filterProducts(req, res, next) {
	try {
		const { categories, brands, minRating, maxRating } = req.query;

		const filter = {
			rating: {
				$lte: maxRating ? parseFloat(maxRating) : 5,
				$gte: minRating ? parseFloat(minRating) : 0,
			},
		};

		if (categories) {
			filter.categories = {
				$in: categories,
			};
		}

		if (brands) {
			filter.brand = {
				$in: brands,
			};
		}

		Product.find(filter)
			.populate("category")
			.populate({
				path: "brand",
				populate: "image",
			})
			.populate({
				path: "stock_details",
				populate: "image",
			})
			.then(async (products) => {
				res.status(200).json({
					message: "success",
					products,
				});
			})
			.catch((error) => {
				next(error);
				return;
			});
	} catch (error) {
		next(error);
		return;
	}
}

// GET product by id.
function productById(req, res, next) {
	try {
		const { id } = req.params;

		Product.findById(id)
			.then(async (product) => {
				product = await populateAllAttributes(
					product,
					productDetailsSchema
				);

				res.status(200).json({
					message: "success",
					product,
				});
			})
			.catch((error) => {
				next(error);
				return;
			});
	} catch (error) {
		next(error);
		return;
	}
}

// CREATE a new product with multiple stock details.
async function createProduct(req, res, next) {
	// ----> work in progress
	const { title, description, categories, brand } = req.body;
	const brandArray = brand.split(",");
	const categoriesArray = categories.split(",");

	const product = new Product({
		title,
		description,
		category: categoriesArray,
		brand: brandArray,
		created_at: Date.now(),
		modified_at: Date.now(),
	});

	req.images =
		req.files != null ? await insertMultipleImages(req.files) : null; // array of image ids.

	const stockDetailsArray = JSON.parse(req.body.stockDetails); // array of stock details objects.

	try {
		const createdStockDetails = await Promise.all(
			stockDetailsArray.map(async (stockDetailData) => {
				const { color, size, amount, quantity, images } =
					stockDetailData;
				const imageArray = [];
				for (let image of req.images) {
					if (images.includes(image.name)) {
						imageArray.push(image.id);
					}
				}
				// console.log(imageArray);
				const newStockDetail = new stockDetail({
					product_id: product._id,
					color: color.toUpperCase(),
					size: size.toUpperCase(),
					amount: amount,
					quantity: quantity,
					image: imageArray,
				});

				await newStockDetail.validate();
				product.stock_details.push(newStockDetail._id);
				await newStockDetail.save();
				return newStockDetail;
			})
		);

		await product.save();

		res.status(201).json({
			status: "success",
			message: "Product created successfully",
			data: {
				product: product,
				stockDetails: createdStockDetails,
			},
		});
	} catch (error) {
		next(error);
	}
}

// UPDATE an existing product.
async function updateProduct(req, res, next) {
	const { id } = req.params;
	console.log(id);
	const {
		title,
		description,
		categories,
		brand,
		color,
		size,
		amount,
		quantity,
		image_id, // Image ids as stored in the db
	} = req.body;
	const brandArray = brand.split(",");
	const categoriesArray = categories.split(",");
	const img_idx = image_id.split(",");
	try {
		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({
				status: "fail",
				message: "Product not found",
			});
		}

		product.title = title;
		product.description = description;
		product.category = categoriesArray;
		product.brand = brandArray;
		product.modified_at = Date.now();

		const stockDetails = await stockDetail.findOneAndUpdate(
			{ product_id: id, color, size },
			{ amount, quantity },
			{ upsert: true, new: true }
		);

		if (img_idx && req.files) {
			req.files.forEach(async (file, idx) => {
				await updateImage(img_idx[idx], file);
			});
		}

		await stockDetails.save();

		await product.save();

		res.status(200).json({
			status: "success",
			message: "Product updated successfully",
			data: {
				product,
			},
		});
	} catch (error) {
		next(error);
	}
}

// DELETE an existing product.
async function deleteProduct(req, res, next) {
	const { id } = req.params;

	try {
		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({
				status: "fail",
				message: "Product not found",
			});
		}

		const stock = await stockDetail.find({ product_id: id });

		stock.map(async (stock) => {
			// working as a for loop
			const imageIds = stock.image;
			if (imageIds && imageIds.length > 0) {
				await ImageDetails.deleteMany({ _id: { $in: imageIds } });
			}
		});

		// Delete stock details
		await stockDetail.deleteMany({ product_id: id });

		// Delete product
		await product.delete();

		res.status(200).json({
			status: "success",
			message: "Product deleted successfully",
			data: null,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	fetchProducts,
	filterProducts,
	productById,
	createProduct,
	updateProduct,
	deleteProduct,
};
