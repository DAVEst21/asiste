const express = require('express');
const router = express.Router();
const { obtenerEstadisticasGrupo } = require('../controllers/estadisticasController');
const { protect } = require('../middleware/authMiddleware');

router.get('/grupo/:grupoId', protect, obtenerEstadisticasGrupo);

module.exports = router;
