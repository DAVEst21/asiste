const router = require('express').Router();
const controller = require('../controllers/reporteController');
const { asyncHandler } = require('../utils/http');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { groupAccess } = require('../middleware/groupAccess');
router.use(protect);
router.get('/grupo/:grupoId', groupAccess({ allowStudent: true }), asyncHandler(controller.obtenerReporteGrupo));
module.exports = router;
