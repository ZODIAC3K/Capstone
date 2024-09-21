const express = require('express');
const { bannerController } = require('../controllers');
const router = express.Router();

// GET banners ( based on type -> optional)
router.get('/:type', bannerController.getBannerByType);

// GET banner by Id
router.get('/:id', bannerController.getBannerById);

// GET all banners
router.get('/', bannerController.getBanners);

// Classify all other requests to this route as bad requests
router.all('/',(req,res, next)=>{next(CustomErrorHandler.badRequest()); return;})

module.exports = router;