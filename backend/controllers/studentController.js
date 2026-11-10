const Asistencia = require('../models/Asistencia');
const Alumno = require('../models/Alumno');
const { fail, password } = require('../utils/http');

const getMyHistory = async (req, res) => {
    res.json(await Asistencia.find({ alumno_id: req.user._id }).sort({ fecha: -1 }));
};
const changePassword = async (req, res) => {
    const alumno = await Alumno.findById(req.user._id).select('+password');
    if (typeof req.body.currentPassword !== 'string' || !(await alumno.matchPassword(req.body.currentPassword))) {
        fail(400, 'La contraseña actual es incorrecta.');
    }
    alumno.password = password(req.body.newPassword);
    await alumno.save();
    res.json({ message: 'Contraseña actualizada correctamente.' });
};
module.exports = { getMyHistory, changePassword };
