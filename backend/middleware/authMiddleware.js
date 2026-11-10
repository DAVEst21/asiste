const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');
const { asyncHandler, fail } = require('../utils/http');
const mongoose = require('mongoose');

const protect = asyncHandler(async (req, res, next) => {
    const match = /^Bearer ([^ ]+)$/.exec(req.headers.authorization || '');
    if (!match) fail(401, 'Inicia sesión para continuar.');
    let decoded;
    try {
        decoded = jwt.verify(match[1], req.app.locals.jwtSecret, {
            algorithms: ['HS256'], issuer: 'asiste', audience: 'asiste-web'
        });
    } catch { fail(401, 'La sesión expiró o no es válida.'); }
    if (!mongoose.isObjectIdOrHexString(decoded.id) || !['alumno', 'docente', 'admin'].includes(decoded.rol)) {
        fail(401, 'La sesión no es válida.');
    }
    const model = decoded.rol === 'alumno' ? Alumno : Usuario;
    req.user = await model.findById(decoded.id);
    if (!req.user) fail(401, 'La cuenta ya no está disponible.');
    if (decoded.rol === 'alumno') req.user.rol = 'alumno';
    // Una modificación de rol en BD invalida el permiso anterior del token.
    if (req.user.rol !== decoded.rol) fail(401, 'Inicia sesión de nuevo.');
    next();
});
const allowRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) return res.status(403).json({ message: 'No tienes permiso para esta operación.' });
    next();
};
module.exports = { protect, allowRoles, admin: allowRoles('admin') };
