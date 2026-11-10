const router = require('express').Router();
const controller = require('../controllers/studentController');
const { asyncHandler } = require('../utils/http');
const { protect, allowRoles } = require('../middleware/authMiddleware');
router.use(protect);
router.use(allowRoles('alumno'));
router.get('/history', asyncHandler(controller.getMyHistory));
router.put('/password', asyncHandler(controller.changePassword));
module.exports = router;
