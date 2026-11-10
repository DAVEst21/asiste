const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Determinar si es Usuario o Alumno basado en el rol del payload (si existe) o intentando buscar
            if (decoded.rol === 'alumno') {
                req.user = await Alumno.findById(decoded.id).select('-password');
                // Agregar propiedad rol explícita si no viene del modelo
                if (req.user) req.user.rol = 'alumno';
            } else {
                req.user = await Usuario.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'No autorizado, token fallido' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'No autorizado como administrador' });
    }
};

module.exports = { protect, admin };
