// Compatibilidad: este comando ya no elimina datos ni reinicia contraseñas.
const mongoose = require('mongoose');
require('../scripts/seed-demo').main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
