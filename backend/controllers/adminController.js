const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');
const Grupo = require('../models/Grupo');
const Asistencia = require('../models/Asistencia');
const { fail, objectId, text, password } = require('../utils/http');

async function find(model, id, filter = {}) {
    const record = await model.findOne({ _id: objectId(id), ...filter });
    if (!record) fail(404, 'Registro no encontrado.');
    return record;
}
async function teacher(id) { return find(Usuario, id, { rol: 'docente' }); }
function email(value) {
    const result = text(value, 'Email', 150).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(400, 'Introduce un email válido.');
    return result;
}
const getDocentes = async (req, res) => res.json(await Usuario.find({ rol: 'docente' }).sort({ nombre: 1 }));
const createDocente = async (req, res) => res.status(201).json(await Usuario.create({
    nombre: text(req.body.nombre, 'Nombre'), email: email(req.body.email),
    password: password(req.body.password), rol: 'docente'
}));
const updateDocente = async (req, res) => {
    const record = await teacher(req.params.id);
    if (req.body.nombre !== undefined) record.nombre = text(req.body.nombre, 'Nombre');
    if (req.body.email !== undefined) record.email = email(req.body.email);
    if (req.body.password) record.password = password(req.body.password);
    await record.save();
    res.json(record);
};
const deleteDocente = async (req, res) => {
    const record = await teacher(req.params.id);
    if (await Grupo.exists({ docente_id: record._id })) fail(409, 'Reasigna los grupos antes de eliminar al docente.');
    await record.deleteOne();
    res.json({ message: 'Docente eliminado.' });
};
const getAlumnosAdmin = async (req, res) => res.json(await Alumno.find().populate('grupo_id', 'nombre').sort({ nombre: 1 }));
const createAlumno = async (req, res) => {
    const grupo = await find(Grupo, req.body.grupo_id);
    res.status(201).json(await Alumno.create({
        nombre: text(req.body.nombre, 'Nombre'), matricula: text(req.body.matricula, 'Matrícula', 50),
        grupo_id: grupo._id, password: password(req.body.password)
    }));
};
const updateAlumno = async (req, res) => {
    const record = await find(Alumno, req.params.id);
    if (req.body.grupo_id !== undefined) {
        const grupo = await find(Grupo, req.body.grupo_id);
        if (String(record.grupo_id) !== String(grupo._id) && await Asistencia.exists({ alumno_id: record._id })) {
            fail(409, 'El alumno tiene historial; el cambio de grupo requiere una migración de historial.');
        }
        record.grupo_id = grupo._id;
    }
    if (req.body.nombre !== undefined) record.nombre = text(req.body.nombre, 'Nombre');
    if (req.body.matricula !== undefined) record.matricula = text(req.body.matricula, 'Matrícula', 50);
    if (req.body.password) record.password = password(req.body.password);
    await record.save();
    res.json(record);
};
const deleteAlumno = async (req, res) => {
    const record = await find(Alumno, req.params.id);
    if (await Asistencia.exists({ alumno_id: record._id })) fail(409, 'No se elimina un alumno con historial de asistencia.');
    await record.deleteOne();
    res.json({ message: 'Alumno eliminado.' });
};
const getGruposAdmin = async (req, res) => res.json(await Grupo.find().populate('docente_id', 'nombre').sort({ nombre: 1 }));
const createGrupo = async (req, res) => {
    const docente = await teacher(req.body.docente_id);
    res.status(201).json(await Grupo.create({ nombre: text(req.body.nombre, 'Nombre'), materia: text(req.body.materia, 'Materia'),
        docente_id: docente._id, semestre: req.body.semestre ? text(req.body.semestre, 'Semestre', 20) : '' }));
};
const updateGrupo = async (req, res) => {
    const record = await find(Grupo, req.params.id);
    if (req.body.nombre !== undefined) record.nombre = text(req.body.nombre, 'Nombre');
    if (req.body.materia !== undefined) record.materia = text(req.body.materia, 'Materia');
    if (req.body.docente_id !== undefined) record.docente_id = (await teacher(req.body.docente_id))._id;
    await record.save();
    res.json(record);
};
const deleteGrupo = async (req, res) => {
    const record = await find(Grupo, req.params.id);
    if (await Alumno.exists({ grupo_id: record._id }) || await Asistencia.exists({ grupo_id: record._id })) {
        fail(409, 'No se elimina un grupo con alumnos o asistencias.');
    }
    await record.deleteOne();
    res.json({ message: 'Grupo eliminado.' });
};
module.exports = { getDocentes, createDocente, updateDocente, deleteDocente, getAlumnosAdmin, createAlumno, updateAlumno,
    deleteAlumno, getGruposAdmin, createGrupo, updateGrupo, deleteGrupo };
