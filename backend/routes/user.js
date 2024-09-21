// Write user detail fetching
const express = require('express');
const { auth } = require('../middlewares');
const { CustomErrorHandler, upload } = require('../services');
const { userController, addressController } = require('../controllers');
const router = express.Router();

router.use( auth.jwtAuth )
router.use( auth.userCheck )

// GET request
router.get('/', userController.fetchUser);
router.get('/address', addressController.fetchAddress)

// POST request ( for address )
router.post('/address', addressController.addAddress)

// PATCH request
router.patch('/', upload.single('image'), userController.updateUser);
router.patch('/address', addressController.updateAddress);

// DELETE request
router.delete('/', userController.deleteUser);

// Classify all other requests to this route as bad requests
router.all('/',(req,res, next)=>{next(CustomErrorHandler.badRequest()); return;});

module.exports = router;