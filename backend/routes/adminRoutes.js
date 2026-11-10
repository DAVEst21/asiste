const express = require('express');
const router = express.Router();
const {
    getDocentes, createDocente, updateDocente, deleteDocente,
    getAlumnosAdmin, createAlumno, updateAlumno, deleteAlumno,
    getGruposAdmin, createGrupo, updateGrupo, deleteGrupo
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const { asyncHandler } = require('../utils/http');
router.use(protect, admin);

// rutas docentes
router.route('/docentes').get(asyncHandler(getDocentes)).post(asyncHandler(createDocente));
router.route('/docentes/:id').put(asyncHandler(updateDocente)).delete(asyncHandler(deleteDocente));

// rutas alumnos
router.route('/alumnos').get(asyncHandler(getAlumnosAdmin)).post(asyncHandler(createAlumno));
router.route('/alumnos/:id').put(asyncHandler(updateAlumno)).delete(asyncHandler(deleteAlumno));

// rutas grupos
router.route('/grupos').get(asyncHandler(getGruposAdmin)).post(asyncHandler(createGrupo));
router.route('/grupos/:id').put(asyncHandler(updateGrupo)).delete(asyncHandler(deleteGrupo));

module.exports = router;
