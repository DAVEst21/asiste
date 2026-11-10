const Grupo = require('../models/Grupo');
const Alumno = require('../models/Alumno');

const getGruposDocente = async (req, res) => {
    // Asumimos que req.user.id viene del middleware de auth (que implementaremos/integraremos)
    // Por ahora, para simplificar Sprint 2 sin middleware complejo, pasaremos el ID por query o body si es necesario,
    // pero lo ideal es usar el token. Vamos a asumir que el token se decodifica en un middleware.
    // Como no tenemos middleware de auth protegiendo rutas aun en server.js, vamos a simular o extraer del body por simplicidad extrema
    // O mejor, implementamos un middleware simple rapidido.

    // NOTA: Para este sprint, usaremos el ID que viene en req.user (inyectado por middleware protect)
    try {
        const grupos = await Grupo.find({ docente_id: req.user.id });
        res.json(grupos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAlumnosGrupo = async (req, res) => {
    try {
        const alumnos = await Alumno.find({ grupo_id: req.params.grupoId });
        res.json(alumnos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getGruposDocente, getAlumnosGrupo };
