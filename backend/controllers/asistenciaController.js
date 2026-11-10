const Asistencia = require('../models/Asistencia');

const registrarAsistencia = async (req, res) => {
    const { grupo_id, fecha, asistencias } = req.body;
    // asistencias es un array de objetos { alumno_id, estado, observaciones }

    try {
        // En lugar de verificar si existe y bloquear, usamos bulkWrite para hacer UPSERT
        // Esto permite modificar registros individuales de un día ya tomado.

        const operaciones = asistencias.map(a => ({
            updateOne: {
                filter: {
                    grupo_id: grupo_id,
                    fecha: new Date(fecha),
                    alumno_id: a.alumno_id
                },
                update: {
                    $set: {
                        estado: a.estado,
                        observaciones: a.observaciones || ''
                    }
                },
                upsert: true
            }
        }));

        const resultado = await Asistencia.bulkWrite(operaciones);

        res.status(200).json({
            message: 'Asistencia guardada/actualizada correctamente',
            detalles: resultado
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const obtenerAsistenciaFecha = async (req, res) => {
    const { grupoId, fecha } = req.params;
    try {
        const registros = await Asistencia.find({
            grupo_id: grupoId,
            fecha: new Date(fecha)
        }).populate('alumno_id', 'nombre');

        res.json(registros);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registrarAsistencia, obtenerAsistenciaFecha };
