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
        select: false
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

// Calcular el hash antes de guardar; no se vuelve a aplicar si no cambió.
alumnoSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

alumnoSchema.set('toJSON', { transform: (doc, ret) => { delete ret.password; return ret; } });

// Método para comparar passwords
alumnoSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

alumnoSchema.add({ demoTag: { type: String, select: false } });

module.exports = mongoose.model('Alumno', alumnoSchema);
