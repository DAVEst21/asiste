const express = require('express');
const router = express.Router();
const {
    getDocentes, createDocente, updateDocente, deleteDocente,
    getAlumnosAdmin, createAlumno, updateAlumno, deleteAlumno,
    getGruposAdmin, createGrupo, updateGrupo, deleteGrupo
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Middleware para verificar rol admin
// Nota: Necesitamos actualizar authMiddleware.js para exportar 'admin'
// Por ahora definiré el middleware admin aquí si no existe allá, o lo importaré
// Asumimos que lo agregaremos al middleware.

router.use(protect);

// rutas docentes
router.route('/docentes').get(getDocentes).post(createDocente);
router.route('/docentes/:id').put(updateDocente).delete(deleteDocente);

// rutas alumnos
router.route('/alumnos').get(getAlumnosAdmin).post(createAlumno);
router.route('/alumnos/:id').put(updateAlumno).delete(deleteAlumno);

// rutas grupos
router.route('/grupos').get(getGruposAdmin).post(createGrupo);
router.route('/grupos/:id').put(updateGrupo).delete(deleteGrupo);

module.exports = router;
