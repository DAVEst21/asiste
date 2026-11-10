const router = require('express').Router();
const controller = require('../controllers/grupoController');
const { asyncHandler } = require('../utils/http');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { groupAccess } = require('../middleware/groupAccess');
router.use(protect);
router.get('/', allowRoles('admin', 'docente'), asyncHandler(controller.getGruposDocente));
router.get('/:grupoId/alumnos', allowRoles('admin', 'docente'), groupAccess(), asyncHandler(controller.getAlumnosGrupo));
module.exports = router;
