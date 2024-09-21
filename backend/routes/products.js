const express = require("express");
const { productController } = require("../controllers");
const { CustomErrorHandler } = require("../services");
const router = express.Router();

router.get("/", productController.fetchProducts);

router.get('/search', productController.filterProducts);

router.get('/:id', productController.productById)

router.all("/", (req, res, next) => {
	next(CustomErrorHandler.badRequest());
	return;
});

module.exports = router;