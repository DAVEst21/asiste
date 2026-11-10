const mongoose = require('mongoose');

const asistenciaSchema = new mongoose.Schema({
    alumno_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alumno',
        required: true
    },
    grupo_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grupo',
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    estado: {
        type: String,
        enum: ['presente', 'retardo', 'falta'],
        required: true
    },
    observaciones: {
        type: String
    }
}, {
    timestamps: true
});

// Indice compuesto: Un alumno solo puede tener un registro por fecha en un grupo
asistenciaSchema.index({ alumno_id: 1, grupo_id: 1, fecha: 1 }, { unique: true });

// Indice para busquedas por grupo y fecha
asistenciaSchema.index({ grupo_id: 1, fecha: 1 });

asistenciaSchema.add({ demoTag: { type: String, select: false } });

module.exports = mongoose.model('Asistencia', asistenciaSchema);
