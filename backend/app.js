const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

function createApp({ jwtSecret }) {
    if (typeof jwtSecret !== 'string' || jwtSecret.length < 32) throw new Error('JWT_SECRET no válido.');
    const app = express();
    app.disable('x-powered-by');
    app.locals.jwtSecret = jwtSecret;
    app.use(express.json({ limit: '100kb' }));
    app.get('/api/health', (req, res) => {
        const connected = mongoose.connection.readyState === 1;
        res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable' });
    });
    for (const [prefix, file] of Object.entries({
        auth: 'auth', grupos: 'grupo', asistencias: 'asistencia', reportes: 'reporte',
        estadisticas: 'estadisticas', admin: 'admin', student: 'student'
    })) app.use(`/api/${prefix}`, require(`./routes/${file}Routes`));
    app.use('/api', (req, res) => res.status(404).json({ message: 'Ruta de API no encontrada.' }));
    app.use(express.static(path.join(__dirname, '..', 'dist')));
    app.get('*', (req, res, next) => res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'), error => {
        if (error) next(Object.assign(new Error('Compila la interfaz con npm run build o usa npm run dev.'), { status: 404 }));
    }));
    app.use((error, req, res, next) => {
        if (res.headersSent) return next(error);
        let status = error.status || 500;
        let message = error.message;
        if (error.code === 11000) { status = 409; message = 'Ya existe un registro con ese email o matrícula.'; }
        if (['ValidationError', 'CastError'].includes(error.name)) { status = 400; message = 'Revisa los datos enviados.'; }
        if (status >= 500) { console.error(error); message = 'No fue posible completar la operación.'; }
        res.status(status).json({ message });
    });
    return app;
}
module.exports = { createApp };
