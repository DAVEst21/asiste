const Asistencia = require('../models/Asistencia');
const Alumno = require('../models/Alumno');
const { fail, objectId, dateOnly } = require('../utils/http');

const registrarAsistencia = async (req, res) => {
    const { asistencias } = req.body;
    const fecha = dateOnly(req.body.fecha);
    if (!Array.isArray(asistencias) || !asistencias.length || asistencias.length > 500) fail(400, 'Envía entre 1 y 500 asistencias.');
    const ids = new Set();
    const registros = asistencias.map(a => {
        if (!a || typeof a !== 'object') fail(400, 'Registro de asistencia no válido.');
        const id = objectId(a.alumno_id, 'Alumno');
        if (ids.has(id)) fail(400, 'No repitas alumnos en la misma solicitud.');
        ids.add(id);
        if (!['presente', 'retardo', 'falta'].includes(a.estado)) fail(400, 'Estado de asistencia no válido.');
        if (a.observaciones != null && (typeof a.observaciones !== 'string' || a.observaciones.length > 500)) fail(400, 'Las observaciones admiten hasta 500 caracteres.');
        return { alumno_id: id, grupo_id: req.grupo._id, fecha, estado: a.estado, ...(a.observaciones != null ? { observaciones: a.observaciones } : {}) };
    });
    const count = await Alumno.countDocuments({ _id: { $in: [...ids] }, grupo_id: req.grupo._id });
    if (count !== ids.size) fail(403, 'Todos los alumnos deben pertenecer al grupo seleccionado.');
    // Validar TODO el lote antes de escribir: bulkWrite no ejecuta los validadores de update de Mongoose.
    await Asistencia.bulkWrite(registros.map(({ alumno_id, grupo_id, fecha, ...data }) => ({
        updateOne: { filter: { alumno_id, grupo_id, fecha }, update: { $set: data }, upsert: true }
    })));
    res.json({ message: 'Asistencia guardada correctamente.', registros: registros.length });
};
const obtenerAsistenciaFecha = async (req, res) => {
    res.json(await Asistencia.find({ grupo_id: req.grupo._id, fecha: dateOnly(req.params.fecha) }).populate('alumno_id', 'nombre'));
};
module.exports = { registrarAsistencia, obtenerAsistenciaFecha };
