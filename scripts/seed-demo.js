require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../backend/config/db');
const { seedDemo } = require('./demo-data');

async function main() {
    const uri = process.env.MONGO_URI;
    if (!uri || new URL(uri).pathname !== '/asiste_demo') throw new Error('Configura MONGO_URI con la base explícita asiste_demo.');
    await connectDB(uri);
    const result = await seedDemo();
    console.log(`Demo preparada en ${result.database}: ${result.created} cuentas/grupos nuevos. No se borraron ni reiniciaron datos.`);
    console.log('Cuentas y contraseña inicial: consulta README.md.');
}
if (require.main === module) main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
}).finally(() => mongoose.disconnect());
module.exports = { main };
