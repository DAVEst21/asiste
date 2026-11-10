const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./backend/config/db');
const path = require('path');

dotenv.config();

// Conectar a BD
connectDB();

const app = express();

app.use(express.json());

// Servir archivos estáticos del frontend (Build de React)
app.use(express.static(path.join(__dirname, 'dist')));

// Rutas de API
const authRoutes = require('./backend/routes/authRoutes');
const grupoRoutes = require('./backend/routes/grupoRoutes');
const asistenciaRoutes = require('./backend/routes/asistenciaRoutes');
const reporteRoutes = require('./backend/routes/reporteRoutes');
const estadisticasRoutes = require('./backend/routes/estadisticasRoutes');
const adminRoutes = require('./backend/routes/adminRoutes');
const studentRoutes = require('./backend/routes/studentRoutes');

// Usar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/grupos', grupoRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// Ruta base para SPA (Cualquier ruta no API devuelve index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
