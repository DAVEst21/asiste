const mongoose = require('mongoose');
const Usuario = require('./backend/models/Usuario');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/asisteuaz', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('MongoDB Conectado');

        const adminEmail = 'admin@example.test';
        const exists = await Usuario.findOne({ email: adminEmail });

        if (exists) {
            console.log('Admin ya existe');
            // Asegurar que sea admin
            exists.rol = 'admin';
            // Reset password to known
            exists.password = '12345';
            await exists.save();
            console.log('Admin actualizado (Pass: 12345)');
        } else {
            await Usuario.create({
                nombre: 'Administrador Principal',
                email: adminEmail,
                password: '12345',
                rol: 'admin'
            });
            console.log('Admin creado: admin@example.test / 12345');
        }

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
