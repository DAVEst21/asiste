const Grupo = require('../models/Grupo');
const { asyncHandler, fail, objectId } = require('../utils/http');

// Los permisos se comprueban para cada recurso, además de comprobar el rol.
const groupAccess = ({ allowStudent = false } = {}) => asyncHandler(async (req, res, next) => {
    const id = objectId(req.params.grupoId || req.body.grupo_id, 'Grupo');
    const grupo = await Grupo.findById(id);
    if (!grupo) fail(404, 'Grupo no encontrado.');
    const { rol } = req.user;
    const ownsGroup = rol === 'docente' && String(grupo.docente_id) === String(req.user._id);
    const isOwnStudentGroup = allowStudent && rol === 'alumno' && String(req.user.grupo_id) === id;
    if (rol !== 'admin' && !ownsGroup && !isOwnStudentGroup) fail(403, 'No tienes acceso a este grupo.');
    req.grupo = grupo;
    next();
});

module.exports = { groupAccess };
