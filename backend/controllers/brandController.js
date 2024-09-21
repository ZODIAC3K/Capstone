const { BrandDetails, brandSchema } = require("../models");
const { CustomErrorHandler, populateAllAttributes } = require("../services");
const { insertImage } = require("./imageController");

// Create a new brand
exports.createBrand = async (req, res, next) => {
	try {
        if(!req.file){
            next(CustomErrorHandler.badRequest('Brand image not provided!'))
        }

		// add image adding functionality
		req.image = await insertImage(req.file);

		const newBrand = await BrandDetails.create({
			...req.body,
			image: req.image,
		});
		res.status(201).json({
			status: "success",
			message: "Brand Created Successfully",
			data: {
				brand: newBrand,
			},
		});
	} catch (err) {
		next(err);
	}
};

// Get all brands
exports.getBrand = async (req, res) => {
	try {
		var brands = await BrandDetails.find();
        brands = await populateAllAttributes(brands, brandSchema);
		res.status(200).json({
			status: "success",
			results: brands.length,
			data: {
				brands: brands,
			},
		});
	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// Update a brand by ID
exports.updateBrand = async (req, res) => {
	try {
		const id = req.params.id;

		if (req.file) {
			const brand = await BrandDetails.findById(id);
			req.body.image = await updateImage(brand.image, req.file);
		}

		const updatedBrand = await BrandDetails.findByIdAndUpdate(
			id,
			req.body,
			{
				new: true,
				runValidators: true,
			}
		);
		res.status(200).json({
			status: "success",
			message: "Brand updated Successfully",
			data: {
				brand: updatedBrand,
			},
		});
	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// Delete a brand by ID
exports.deleteBrand = async (req, res) => {
	try {
		await BrandDetails.findByIdAndDelete(req.params.id);
		res.status(200).json({
			status: "success",
			message: "Brand Deleted Successfully",
		});
	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};
