const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');
const jwt = require('jsonwebtoken');

const generateToken = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    try {
        const usuarioExists = await Usuario.findOne({ email });

        if (usuarioExists) {
            return res.status(400).json({ message: 'Usuario ya existe' });
        }

        const usuario = await Usuario.create({
            nombre,
            email,
            password,
            rol
        });

        if (usuario) {
            res.status(201).json({
                _id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                token: generateToken(usuario._id, usuario.rol),
            });
        } else {
            res.status(400).json({ message: 'Datos de usuario inválidos' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const authUser = async (req, res) => {
    const { email, password } = req.body; // email puede ser matricula

    try {
        // 1. Intentar buscar como Usuario (Email)
        const usuario = await Usuario.findOne({ email });

        if (usuario && (await usuario.matchPassword(password))) {
            return res.json({
                _id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                token: generateToken(usuario._id, usuario.rol),
            });
        }

        // 2. Intentar buscar como Alumno (Matricula)
        const alumno = await Alumno.findOne({ matricula: email });

        if (alumno && (await alumno.matchPassword(password))) {
            return res.json({
                _id: alumno._id,
                nombre: alumno.nombre,
                matricula: alumno.matricula,
                rol: 'alumno', // Rol implícito
                grupo_id: alumno.grupo_id,
                token: generateToken(alumno._id, 'alumno'),
            });
        }

        res.status(401).json({ message: 'Credenciales inválidas (Email/Matrícula o Password)' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, authUser };
