const Asistencia = require('../models/Asistencia');
const Alumno = require('../models/Alumno');
const mongoose = require('mongoose');

const obtenerEstadisticasGrupo = async (req, res) => {
    const { grupoId } = req.params;

    try {
        // 1. Total Alumnos
        const totalAlumnos = await Alumno.countDocuments({ grupo_id: grupoId });

        // 2. Clases Impartidas (Fechas únicas en asistencias)
        const clases = await Asistencia.distinct('fecha', { grupo_id: grupoId });
        const clasesImpartidas = clases.length;

        // 3. Promedio Asistencia General
        // Usamos agregation para sumar todo de una vez
        const stats = await Asistencia.aggregate([
            { $match: { grupo_id: new mongoose.Types.ObjectId(grupoId) } },
            {
                $group: {
                    _id: null,
                    totalRegistros: { $sum: 1 }, // Total de (Alumno x Dia)
                    presentes: {
                        $sum: { $cond: [{ $eq: ['$estado', 'presente'] }, 1, 0] }
                    },
                    retardos: {
                        $sum: { $cond: [{ $eq: ['$estado', 'retardo'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    // Asistencia = (Presentes + Retardos) / TotalGeneral * 100
                    promedio: {
                        $multiply: [
                            { $divide: [{ $add: ['$presentes', '$retardos'] }, '$totalRegistros'] },
                            100
                        ]
                    }
                }
            }
        ]);

        const promedioAsistencia = stats.length > 0 ? Math.round(stats[0].promedio) : 0;

        res.json({
            totalAlumnos,
            clasesImpartidas,
            promedioAsistencia
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { obtenerEstadisticasGrupo };
