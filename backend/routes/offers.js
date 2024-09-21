const express = require('express');
const { offerController } = require('../controllers');
const router = express.Router();

// GET banner by Id
router.get('/:id', offerController.getOfferById);

// GET all banners
router.get('/', offerController.getOffers);

// GET filtered banners ( pass filters in body )
router.get('/filter', offerController.getOffersByFilter);

// Classify all other requests to this route as bad requests
router.all('/',(req,res, next)=>{next(CustomErrorHandler.badRequest()); return;})

module.exports = router;