const express = require('express');
const router = express.Router();
const { getMyHistory, changePassword } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Todo requiere login

router.get('/history', getMyHistory);
router.put('/password', changePassword);

module.exports = router;
