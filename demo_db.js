const mongoose = require('mongoose');
const Usuario = require('./backend/models/Usuario');
const Alumno = require('./backend/models/Alumno');
const Grupo = require('./backend/models/Grupo');
const Asistencia = require('./backend/models/Asistencia');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/asisteuaz';

const runDemo = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`✅ Conectado a MongoDB: ${MONGO_URI}\n`);

        console.log("🔍 --- VALIDACIÓN DE INTEGRIDAD REFERENCIAL ---\n");
        let issues = 0;

        // 1. Validar Grupos -> Docentes
        const grupos = await Grupo.find();
        console.log(`📋 Revisando ${grupos.length} Grupos...`);
        for (const g of grupos) {
            const docente = await Usuario.findById(g.docente_id);
            if (!docente) {
                console.error(`❌ [ERROR] Grupo '${g.nombre}' (ID: ${g._id}) referencia a Docente inexistente (${g.docente_id})`);
                issues++;
            }
        }

        // 2. Validar Alumnos -> Grupos
        const alumnos = await Alumno.find();
        console.log(`📋 Revisando ${alumnos.length} Alumnos...`);
        for (const a of alumnos) {
            const grupo = await Grupo.findById(a.grupo_id);
            if (!grupo) {
                console.error(`❌ [ERROR] Alumno '${a.nombre}' (ID: ${a._id}) referencia a Grupo inexistente (${a.grupo_id})`);
                issues++;
            }
        }

        // 3. Validar Asistencias -> Alumnos y Grupos
        const asistencias = await Asistencia.find();
        console.log(`📋 Revisando ${asistencias.length} Asistencias...`);
        for (const asis of asistencias) {
            const alumno = await Alumno.findById(asis.alumno_id);
            const grupo = await Grupo.findById(asis.grupo_id);

            if (!alumno) {
                console.error(`❌ [ERROR] Asistencia (ID: ${asis._id}) referencia a Alumno inexistente (${asis.alumno_id})`);
                issues++;
            }
            if (!grupo) {
                console.error(`❌ [ERROR] Asistencia (ID: ${asis._id}) referencia a Grupo inexistente (${asis.grupo_id})`);
                issues++;
            }
        }

        if (issues === 0) {
            console.log("\n✅ Integridad de Base de Datos VALIDADA: 0 inconsistencias encontradas.");
        } else {
            console.log(`\n⚠️ Se encontraron ${issues} inconsistencias de integridad.`);
        }

        console.log("\n💾 --- DEMOSTRACIÓN DE ALMACENAMIENTO (JSON) ---\n");

        if (grupos.length > 0) {
            console.log("📂 EJEMPLO GRUPO:");
            console.log(JSON.stringify(grupos[0], null, 2));
        }

        const docentes = await Usuario.find({ rol: 'docente' });
        if (docentes.length > 0) {
            console.log("\n👤 EJEMPLO DOCENTE:");
            console.log(JSON.stringify(docentes[0], null, 2));
        }

        if (alumnos.length > 0) {
            console.log("\n🎓 EJEMPLO ALUMNO:");
            console.log(JSON.stringify(alumnos[0], null, 2));
        }

        if (asistencias.length > 0) {
            console.log("\n✅ EJEMPLO ASISTENCIA:");
            console.log(JSON.stringify(asistencias[0], null, 2));
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

runDemo();
