const express = require('express');
const { categoryController } = require('../controllers');
const router = express.Router();

// GET all categories
router.get('/', categoryController.getCategory);

// Classify all other requests to this route as bad requests
router.all('/',(req,res, next)=>{next(CustomErrorHandler.badRequest()); return;})

module.exports = router;