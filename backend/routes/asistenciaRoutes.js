const express = require('express');
const router = express.Router();
const { registrarAsistencia, obtenerAsistenciaFecha } = require('../controllers/asistenciaController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, registrarAsistencia);
router.get('/grupo/:grupoId/fecha/:fecha', protect, obtenerAsistenciaFecha);

module.exports = router;
