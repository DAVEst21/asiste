const Asistencia = require('../models/Asistencia');
const mongoose = require('mongoose');

const obtenerReporteGrupo = async (req, res) => {
    const { grupoId } = req.params;

    try {
        const reporte = await Asistencia.aggregate([
            // 1. Filtrar por grupo y fecha (si existe)
            {
                $match: {
                    grupo_id: new mongoose.Types.ObjectId(grupoId),
                    ...(req.query.startDate && req.query.endDate ? {
                        fecha: {
                            $gte: new Date(req.query.startDate),
                            $lte: new Date(req.query.endDate)
                        }
                    } : {})
                }
            },
            // 2. Agrupar por alumno y sumar estados
            {
                $group: {
                    _id: '$alumno_id',
                    totalClases: { $sum: 1 },
                    presentes: {
                        $sum: { $cond: [{ $eq: ['$estado', 'presente'] }, 1, 0] }
                    },
                    retardos: {
                        $sum: { $cond: [{ $eq: ['$estado', 'retardo'] }, 1, 0] }
                    },
                    faltas: {
                        $sum: { $cond: [{ $eq: ['$estado', 'falta'] }, 1, 0] }
                    }
                }
            },
            // 3. Traer datos del alumno
            {
                $lookup: {
                    from: 'alumnos',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'alumnoInfo'
                }
            },
            // 4. Aplanar array de alumno
            { $unwind: '$alumnoInfo' },
            // 5. Proyectar campos finales y calculo de porcentaje
            // Regla: Asistencia = Presentes + Retardos (Faltas no suman)
            {
                $project: {
                    _id: 1,
                    nombre: '$alumnoInfo.nombre',
                    matricula: '$alumnoInfo.matricula',
                    totalClases: 1,
                    presentes: 1,
                    retardos: 1,
                    faltas: 1,
                    asistenciasReales: { $add: ['$presentes', '$retardos'] },
                    porcentaje: {
                        $multiply: [
                            { $divide: [{ $add: ['$presentes', '$retardos'] }, '$totalClases'] },
                            100
                        ]
                    }
                }
            },
            // 6. Ordenar por nombre
            { $sort: { nombre: 1 } }
        ]);

        res.json(reporte);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { obtenerReporteGrupo };
