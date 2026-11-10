require('dotenv').config();
const mongoose = require('mongoose');
const { getConfig } = require('./backend/config/env');
const connectDB = require('./backend/config/db');
const Grupo = require('./backend/models/Grupo');
const Alumno = require('./backend/models/Alumno');
const Asistencia = require('./backend/models/Asistencia');
async function inspect() {
    await connectDB(getConfig().mongoUri);
    const groups = await Grupo.countDocuments();
    const students = await Alumno.countDocuments();
    const attendance = await Asistencia.countDocuments();
    console.log({ groups, students, attendance });
}
inspect().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
