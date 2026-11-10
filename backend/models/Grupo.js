const mongoose = require('mongoose');

const grupoSchema = new mongoose.Schema({
    nombre: {
        type: String, // Ej: "3A"
        required: true
    },
    materia: {
        type: String, // Ej: "Base de Datos"
        required: true
    },
    semestre: {
        type: String
    },
    docente_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }
});

grupoSchema.add({ demoTag: { type: String, select: false } });

module.exports = mongoose.model('Grupo', grupoSchema);
