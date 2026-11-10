const express = require('express');
const router = express.Router();
const { obtenerReporteGrupo } = require('../controllers/reporteController');
const { protect } = require('../middleware/authMiddleware');

router.get('/grupo/:grupoId', protect, obtenerReporteGrupo);

module.exports = router;
