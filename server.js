require('dotenv').config();
const mongoose = require('mongoose');
const { getConfig } = require('./backend/config/env');
const connectDB = require('./backend/config/db');
const { createApp } = require('./backend/app');

async function start() {
    const { mongoUri, jwtSecret, port } = getConfig();
    await connectDB(mongoUri);
    const server = createApp({ jwtSecret }).listen(port, () => {
        console.log(`Asiste disponible en http://localhost:${port}`);
    });
    const shutdown = () => server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
    });
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
}
if (require.main === module) start().catch(async error => {
    console.error(`No se pudo iniciar Asiste: ${error.message}`);
    await mongoose.disconnect();
    process.exitCode = 1;
});
module.exports = { start };
