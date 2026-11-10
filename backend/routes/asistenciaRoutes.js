const router = require('express').Router();
const controller = require('../controllers/asistenciaController');
const { asyncHandler } = require('../utils/http');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { groupAccess } = require('../middleware/groupAccess');
router.use(protect);
router.post('/', allowRoles('admin', 'docente'), groupAccess(), asyncHandler(controller.registrarAsistencia));
router.get('/grupo/:grupoId/fecha/:fecha', allowRoles('admin', 'docente'), groupAccess(), asyncHandler(controller.obtenerAsistenciaFecha));
module.exports = router;
