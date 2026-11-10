const router = require('express').Router();
const controller = require('../controllers/authController');
const { asyncHandler } = require('../utils/http');
router.post('/register', asyncHandler(controller.registerUser));
router.post('/login', asyncHandler(controller.authUser));
module.exports = router;
