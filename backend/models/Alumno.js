const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const alumnoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    matricula: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        default: '12345' // Default password si no se provee
    },
    telefono: {
        type: String
    },
    grupo_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grupo',
        required: true
    }
});

// Encriptar password antes de guardar
alumnoSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar passwords
alumnoSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Alumno', alumnoSchema);
