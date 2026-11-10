const mongoose = require('mongoose');
const Usuario = require('../backend/models/Usuario');
const Grupo = require('../backend/models/Grupo');
const Alumno = require('../backend/models/Alumno');
const Asistencia = require('../backend/models/Asistencia');

const TAG = 'asiste-demo-v1';
const PASSWORD = 'DemoAsiste2026!'; // Credencial pública: solamente datos ficticios.
const id = n => new mongoose.Types.ObjectId(n.toString(16).padStart(24, '0'));
const accounts = [
    { _id: id(101), nombre: 'Administración Demo', email: 'admin@example.test', rol: 'admin' },
    { _id: id(102), nombre: 'Elena Rivera', email: 'docente@example.test', rol: 'docente' },
    { _id: id(103), nombre: 'Marcos Vidal', email: 'docente2@example.test', rol: 'docente' }
];
const groups = [
    { _id: id(201), nombre: 'DEMO-A', materia: 'Ingeniería de Software', semestre: '7', docente_id: id(102) },
    { _id: id(202), nombre: 'DEMO-B', materia: 'Bases de Datos', semestre: '5', docente_id: id(103) }
];
const students = ['Lucía Torres', 'Mateo Ríos', 'Sofía Luna', 'Diego Sol', 'Valeria Cruz', 'Leo Montes'].map((nombre, i) => ({
    _id: id(301 + i), nombre, matricula: `DEMO-${i + 1}`, grupo_id: id(i < 3 ? 201 : 202)
}));

async function seedDemo({ now = new Date() } = {}) {
    if (mongoose.connection.name !== 'asiste_demo') throw new Error('La demo solamente puede escribir en la base asiste_demo.');
    const fixtures = [
        ...accounts.map(data => ({ model: Usuario, data, key: { email: data.email } })),
        ...groups.map(data => ({ model: Grupo, data, key: { nombre: data.nombre } })),
        ...students.map(data => ({ model: Alumno, data, key: { matricula: data.matricula } }))
    ];
    // Comprobar colisiones antes de insertar. Nunca adoptar, borrar ni modificar registros existentes.
    for (const { model, data, key } of fixtures) {
        const collisions = await model.find({ $or: [{ _id: data._id }, key] }).select('+demoTag');
        if (collisions.some(doc => String(doc._id) !== String(data._id) || doc.demoTag !== TAG)) {
            throw new Error('Hay datos ajenos a la demo con identificadores reservados. No se modificaron.');
        }
    }
    let created = 0;
    for (const { model, data } of fixtures) {
        if (await model.exists({ _id: data._id })) continue;
        await model.create({ ...data, demoTag: TAG, ...([Usuario, Alumno].includes(model) ? { password: PASSWORD } : {}) });
        created++;
    }
    // Días relativos a la primera ejecución: al repetir se conservan registros y contraseñas.
    if (!(await Asistencia.exists({ demoTag: TAG }))) {
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
        const anchor = new Date(`${today}T00:00:00.000Z`);
        for (let day = 2; day >= 0; day--) {
            const fecha = new Date(anchor.getTime() - day * 86400000);
            for (const [i, alumno] of students.entries()) {
                const filter = { alumno_id: alumno._id, grupo_id: alumno.grupo_id, fecha };
                if (!(await Asistencia.exists(filter))) {
                    await Asistencia.create({ ...filter, estado: ['presente', 'retardo', 'falta'][(i + day) % 3], demoTag: TAG });
                }
            }
        }
    }
    return { created, database: mongoose.connection.name };
}
module.exports = { seedDemo, accounts, groups, students, PASSWORD, TAG };
