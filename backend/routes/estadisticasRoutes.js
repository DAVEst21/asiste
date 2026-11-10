const router = require('express').Router();
const controller = require('../controllers/estadisticasController');
const { asyncHandler } = require('../utils/http');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { groupAccess } = require('../middleware/groupAccess');
router.use(protect);
router.get('/grupo/:grupoId', allowRoles('admin', 'docente'), groupAccess(), asyncHandler(controller.obtenerEstadisticasGrupo));
module.exports = router;
