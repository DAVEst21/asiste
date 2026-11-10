const { randomBytes } = require('crypto');
const mongoose = require('mongoose');
const { createMemoryDb } = require('./memory-db');
const { seedDemo } = require('./demo-data');
const { createApp } = require('../backend/app');

async function main() {
    const database = await createMemoryDb('asiste_demo');
    try {
        await mongoose.connect(database.getUri('asiste_demo'));
        await seedDemo();
        const port = Number(process.env.DEMO_PORT || 3000);
        const server = createApp({ jwtSecret: randomBytes(48).toString('hex') }).listen(port, '127.0.0.1', () => {
            console.log(`Asiste demo: http://127.0.0.1:${port} (base temporal asiste_demo; consulta las cuentas en README.md)`);
        });
        const shutdown = () => server.close(async () => {
            await mongoose.disconnect(); await database.stop(); process.exit(0);
        });
        process.once('SIGINT', shutdown);
        process.once('SIGTERM', shutdown);
    } catch (error) {
        await mongoose.disconnect(); await database.stop(); throw error;
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
