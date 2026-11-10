const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Usuario = require('./models/Usuario');
const Grupo = require('./models/Grupo');
const Alumno = require('./models/Alumno');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
    try {
        await Usuario.deleteMany();
        await Grupo.deleteMany();
        await Alumno.deleteMany();

        console.log('Datos limpios...');

        // 1. Crear Usuario Docente
        const docente = await Usuario.create({
            nombre: 'Docente de ejemplo',
            email: 'docente@example.test',
            password: '123', // El pre-save hook lo hasheará
            rol: 'docente'
        });

        console.log('Docente creado');

        // 2. Crear Grupos
        const grupos = await Grupo.insertMany([
            { nombre: '3A', materia: 'Ingeniería de Software', semestre: '3', docente_id: docente._id },
            { nombre: '5B', materia: 'Base de Datos', semestre: '5', docente_id: docente._id },
            { nombre: '7A', materia: 'Inteligencia Artificial', semestre: '7', docente_id: docente._id }
        ]);

        console.log('Grupos creados');

        // 3. Crear Alumnos (Demo: 5 por grupo)
        const alumnosData = [];
        const nombres = ['Ana', 'Beto', 'Carla', 'Daniel', 'Elena', 'Fernando', 'Gaby', 'Hugo', 'Imelda', 'Jorge'];
        const apellidos = ['López', 'García', 'Martínez', 'Rodríguez', 'Hernández'];

        grupos.forEach(grupo => {
            for (let i = 0; i < 5; i++) {
                const nombre = nombres[Math.floor(Math.random() * nombres.length)];
                const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
                alumnosData.push({
                    nombre: `${nombre} ${apellido}`,
                    matricula: `MAT-${grupo.nombre}-${i}`,
                    grupo_id: grupo._id,
                    telefono: ''
                });
            }
        });

        await Alumno.insertMany(alumnosData);
        console.log('Alumnos creados');

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
