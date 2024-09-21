const express = require('express');
const { analyticsController } = require('../controllers');
const router = express.Router();

// GET all numbers of entries
router.get('/', analyticsController.getAnalysis);

// GET filtered numbers of a field
router.get('/:filter', analyticsController.getAnalysisByTimeFilter);

// Classify all other requests to this route as bad requests
router.all('/',(req,res, next)=>{next(CustomErrorHandler.badRequest()); return;})

module.exports = router;