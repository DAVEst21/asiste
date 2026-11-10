const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        required: true,
        unique: true
    },
    password: {
        type: String,
        select: false,
        required: true
    },
    rol: {
        type: String,
        enum: ['admin', 'docente'],
        default: 'docente'
    }
});

// Calcular el hash antes de guardar; no se vuelve a aplicar si no cambió.
usuarioSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

usuarioSchema.set('toJSON', { transform: (doc, ret) => { delete ret.password; return ret; } });

// Método para comparar passwords
usuarioSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

usuarioSchema.add({ demoTag: { type: String, select: false } });

module.exports = mongoose.model('Usuario', usuarioSchema);
