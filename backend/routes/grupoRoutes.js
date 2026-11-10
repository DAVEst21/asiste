const express = require('express');
const router = express.Router();
const { getGruposDocente, getAlumnosGrupo } = require('../controllers/grupoController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getGruposDocente);
router.get('/:grupoId/alumnos', protect, getAlumnosGrupo);

module.exports = router;
