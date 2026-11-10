const mongoose = require('mongoose');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
function fail(status, message) {
    const error = new Error(message);
    error.status = status;
    throw error;
}
function objectId(value, label = 'ID') {
    if (typeof value !== 'string' || !mongoose.isObjectIdOrHexString(value)) fail(400, `${label} no válido.`);
    return new mongoose.Types.ObjectId(value).toHexString();
}
function text(value, label, max = 120) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
        fail(400, `${label} es obligatorio y admite hasta ${max} caracteres.`);
    }
    return value.trim();
}
function password(value) {
    if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) {
        fail(400, 'La contraseña debe tener al menos 8 caracteres y como máximo 72 bytes.');
    }
    return value;
}
function dateOnly(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(400, 'Usa una fecha válida con formato AAAA-MM-DD.');
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) fail(400, 'La fecha no existe.');
    return date;
}
module.exports = { asyncHandler, fail, objectId, text, password, dateOnly };
