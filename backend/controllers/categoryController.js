const { CategoryDetails } = require("../models");

exports.createCategory = async (req, res) => {
	try {
		const newCategory = CategoryDetails.create(req.body);
		res.status(200).json({
			status: "success",
			message: "Category Created Successfully",
			data: await newCategory,
		});
	} catch (error) {
		res.status(400).json({ status: "fail", error: error.message });
	}
};

exports.getCategory = async (req, res) => {
	try {
		const category = await CategoryDetails.find();
		res.status(200).json({
			status: "success",
			results: category.length,
			data: {
				categorys: category,
			},
		});
	} catch (error) {
		res.status(400).json({ status: "fail", error: error.message });
	}
};

exports.updateCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const updatedCategory = await CategoryDetails.findByIdAndUpdate(
			id,
			req.body,
			{ new: true }
		);
		res.status(200).json({
			status: "success",
			message: "Category updated Successfully",
			data: {
				category: updatedCategory,
			},
		});
	} catch (error) {
		res.status(400).json({ status: "fail", error: error.message });
	}
};

exports.deleteCategory = async (req, res) => {
	try {
		const { id } = req.params;
		await CategoryDetails.findByIdAndDelete(id);
		res.status(200).json({
			status: "success",
			message: "Category Deleted Successfully",
		});
	} catch (error) {
		res.status(400).json({ status: "fail", error: error.message });
	}
};
