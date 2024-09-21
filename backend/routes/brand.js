const express = require('express');
const { brandController } = require('../controllers');
const router = express.Router();

// GET all brand
router.get('/', brandController.getBrand);

// Classify all other requests to this route as bad requests
router.all('/',(req,res, next)=>{next(CustomErrorHandler.badRequest()); return;})

module.exports = router;