const { BannerDetails, bannerSchema } = require("../models");
const { populateAllAttributes, CustomErrorHandler } = require("../services");
const { insertImage, updateImage } = require("./imageController");

function getBanners(req, res, next) {
	try {
		BannerDetails.find()
			.populate("image") // response too big may increase load time uncomment if needed
			// .populate({
			// 	path: "applicable_product",
			// 	populate: [
			// 		{ path: "category" },
			// 		{
			// 			path: "brand stock_details",
			// 			populate: "image",
			// 		},
			// 	],
			// })
			.then((banners) => {
				res.status(200).json({
					status: "success",
					data: {
						banners,
					},
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

function getBannerById(req, res, next) {
	try {
		const { id } = req.params;

		BannerDetails.findById(id)
			.then((banner) => {
				populateAllAttributes(banner, bannerSchema).then((banner) => {
					res.status(200).json({
						status: "success",
						data: {
							banner,
						},
					});
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

function getBannerByType(req, res, next) {
	try {
		const { type } = req.params;

		BannerDetails.find({ type })
			.populate("image") // response too big may increase load time uncomment if needed
			// .populate({
			// 	path: "applicable_product",
			// 	populate: [
			// 		{ path: "category" },
			// 		{
			// 			path: "brand stock_details",
			// 			populate: "image",
			// 		},
			// 	],
			// })
			.then(async (banners) => {
				res.status(200).json({
					status: "success",
					data: {
						banners,
					},
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

async function createBanner(req, res, next) {
	try {
		if (!req.file) {
			next(CustomErrorHandler.badRequest("Banner image not provided."));
		}

		if (req.body.applicable_product) {
			req.body.applicable_product = JSON.parse(
				req.body.applicable_product
			);
		}

		req.body.image = await insertImage(req.file);
		const bannerDetails = req.body;

		BannerDetails.create(bannerDetails)
			.then((banner) => {
				res.status(200).json({
					status: "sucess",
					data: {
						banner,
					},
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

async function updateBanner(req, res, next) {
	try {
		const bannerId = req.params.id;

		if (req.file) {
			const banner = await BannerDetails.findById(bannerId);
			req.body.image = await updateImage(banner.image, req.file);
		}

		if (req.body.applicable_product) {
			req.body.applicable_product = JSON.parse(
				req.body.applicable_product
			);
		}

		const bannerDetails = req.body;

		BannerDetails.findByIdAndUpdate(bannerId, bannerDetails, {
			new: true,
			runValidators: true,
		})
			.then((banner) => {
				res.status(200).json({
					status: "sucess",
					data: {
						banner,
					},
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

function bannerDelete(req, res, next) {
	try {
		const bannerId = req.params.id;

		BannerDetails.findByIdAndDelete(bannerId)
			.then((banner) => {})
			.catch((error) => {
				next(error);
				return;
			});
	} catch (error) {
		next(error);
		return;
	}
}

module.exports = {
	getBannerById,
	getBannerByType,
	getBanners,
	createBanner,
	updateBanner,
	bannerDelete,
};
