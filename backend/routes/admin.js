const express = require('express')
const router = express.Router();
const { adminController, brandController, couponController, categoryController, productController, bannerController, offerController } = require("../controllers");
const { upload } = require('../services');
const { auth } = require('../middlewares');
const analyticsRouter = require('./analytics')

router.post('/login',adminController.loginAdmin);

router.use( auth.jwtAuth ) 
router.use( auth.adminCheck )

// brand create, update, delete
router.post('/brand', upload.single('image'), brandController.createBrand);
router.patch('/brand/:id', upload.single('image'), brandController.updateBrand);
router.delete('/brand/:id', brandController.deleteBrand);

// coupon create, update, delete
router.get('/coupon', couponController.getCoupon);
router.post('/coupon', couponController.createCoupon);
router.patch('/coupon/:id', couponController.updateCoupon);
router.delete('/coupon/:id', couponController.deleteCoupon);


// catagory create, update, delete
router.post('/category', categoryController.createCategory);
router.patch('/category/:id', categoryController.updateCategory);
router.delete('/category/:id', categoryController.deleteCategory);

// product create, update,delete // ------------------->>>>>>>> WORKING ON IT
router.post('/product', upload.array('images', 5), productController.createProduct);
router.patch('/product/:id', upload.array('images', 5), productController.updateProduct);
router.delete('/product/:id', productController.deleteProduct);

// banner create, update, delete 
router.post('/banner', upload.single('image'), bannerController.createBanner);
router.patch('/banner/:id', upload.single('image'), bannerController.updateBanner);
router.delete('/banner/:id', bannerController.bannerDelete);

// offer create, update, delete
router.post('/offer', offerController.createOffer);
router.patch('/offer/:id', offerController.updateOffer);
router.delete('/offer/:id', offerController.deleteOffer);
router.delete('/offers', offerController.deleteOffers);

// Analytics Routes
router.use('/analytics', analyticsRouter)

module.exports = router;