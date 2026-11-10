const Grupo = require('../models/Grupo');
const Alumno = require('../models/Alumno');

const getGruposDocente = async (req, res) => {
    res.json(await Grupo.find(req.user.rol === 'admin' ? {} : { docente_id: req.user._id }).sort({ nombre: 1 }));
};
const getAlumnosGrupo = async (req, res) => {
    res.json(await Alumno.find({ grupo_id: req.grupo._id }).sort({ nombre: 1 }));
};
module.exports = { getGruposDocente, getAlumnosGrupo };
