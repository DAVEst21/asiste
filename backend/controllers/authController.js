const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');
const jwt = require('jsonwebtoken');
const { fail, text } = require('../utils/http');

// El administrador provisiona las cuentas. No existe alta pública de personal.
const registerUser = (req, res) => res.status(403).json({ message: 'Solicita tu cuenta a la administración de Asiste.' });
const authUser = async (req, res) => {
    const identifier = text(req.body.email, 'Email o matrícula', 150);
    const { password } = req.body;
    if (typeof password !== 'string' || !password || Buffer.byteLength(password) > 72) fail(400, 'Introduce una contraseña válida.');
    let account = await Usuario.findOne({ email: identifier.toLowerCase() }).select('+password');
    let role = account?.rol;
    if (!account || !(await account.matchPassword(password))) {
        account = await Alumno.findOne({ matricula: identifier }).select('+password');
        role = 'alumno';
        if (!account || !(await account.matchPassword(password))) fail(401, 'Email, matrícula o contraseña incorrectos.');
    }
    const token = jwt.sign({ id: String(account._id), rol: role }, req.app.locals.jwtSecret, {
        algorithm: 'HS256', expiresIn: '2h', issuer: 'asiste', audience: 'asiste-web'
    });
    res.json({ _id: account._id, nombre: account.nombre, rol: role, token,
        ...(role === 'alumno' ? { matricula: account.matricula, grupo_id: account.grupo_id } : { email: account.email }) });
};
module.exports = { registerUser, authUser };
