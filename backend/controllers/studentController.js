const Asistencia = require('../models/Asistencia');
const Alumno = require('../models/Alumno');
const bcrypt = require('bcryptjs');

// Obtener historial completo del alumno logueado
const getMyHistory = async (req, res) => {
    try {
        // req.user viene del middleware protect
        const historial = await Asistencia.find({ alumno_id: req.user._id })
            .sort({ fecha: -1 }); // Más reciente primero

        res.json(historial);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cambiar contraseña del alumno
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const alumno = await Alumno.findById(req.user._id);

        // 1. Verificar password actual
        if (!(await alumno.matchPassword(currentPassword))) {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
        }

        // 2. Actualizar (Pre-save hook hará el hash)
        alumno.password = newPassword;
        await alumno.save();

        res.json({ message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMyHistory, changePassword };
