const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');
const Grupo = require('../models/Grupo');
const bcrypt = require('bcryptjs');

// --- DOCENTES ---
const getDocentes = async (req, res) => {
    const docentes = await Usuario.find({ rol: 'docente' }).select('-password');
    res.json(docentes);
};

const createDocente = async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const nuevo = await Usuario.create({ nombre, email, password, rol: 'docente' });
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateDocente = async (req, res) => {
    const { id } = req.params;
    const { nombre, email, password } = req.body;
    try {
        const docente = await Usuario.findById(id);
        if (!docente) return res.status(404).json({ message: 'Docente no encontrado' });

        docente.nombre = nombre || docente.nombre;
        docente.email = email || docente.email;
        if (password) docente.password = password; // Pre-save hook will hash it

        await docente.save();
        res.json(docente);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteDocente = async (req, res) => {
    try {
        await Usuario.findByIdAndDelete(req.params.id);
        res.json({ message: 'Docente eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- ALUMNOS ---
const getAlumnosAdmin = async (req, res) => {
    const alumnos = await Alumno.find().populate('grupo_id', 'nombre');
    res.json(alumnos);
};

const createAlumno = async (req, res) => {
    try {
        const nuevo = await Alumno.create(req.body); // body: { nombre, matricula, grupo_id, password? }
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateAlumno = async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });

        // Si viene password, se setea y el pre-save lo hashea
        if (req.body.password) alumno.password = req.body.password;
        if (req.body.nombre) alumno.nombre = req.body.nombre;
        if (req.body.matricula) alumno.matricula = req.body.matricula;
        if (req.body.grupo_id) alumno.grupo_id = req.body.grupo_id;

        await alumno.save();
        res.json(alumno);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteAlumno = async (req, res) => {
    try {
        await Alumno.findByIdAndDelete(req.params.id);
        res.json({ message: 'Alumno eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// --- GRUPOS ---
const getGruposAdmin = async (req, res) => {
    const grupos = await Grupo.find().populate('docente_id', 'nombre');
    res.json(grupos);
};

const createGrupo = async (req, res) => {
    try {
        const nuevo = await Grupo.create(req.body);
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateGrupo = async (req, res) => {
    try {
        const grupo = await Grupo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(grupo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteGrupo = async (req, res) => {
    try {
        await Grupo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Grupo eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDocentes, createDocente, updateDocente, deleteDocente,
    getAlumnosAdmin, createAlumno, updateAlumno, deleteAlumno,
    getGruposAdmin, createGrupo, updateGrupo, deleteGrupo
};
