const express = require('express')
const router = express.Router();
const { authController } = require("../controllers");
const { CustomErrorHandler, upload } = require('../services');


// ================= Register ======================

router.post('/reg', upload.single('image') ,authController.register);
router.all('/reg',()=>{ throw CustomErrorHandler.badRequest(); });

// ================= Login =========================

router.post('/login',authController.login);
router.all('/login',()=>{ throw CustomErrorHandler.badRequest(); });

module.exports = router;