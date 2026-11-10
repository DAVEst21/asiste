const { MongoMemoryServer } = require('mongodb-memory-server-core');

// Proceso mongod real y aislado. Se descarga a la caché del usuario; no instala un servicio.
const createMemoryDb = dbName => MongoMemoryServer.create({
    binary: { version: '8.0.16' }, instance: { dbName, ip: '127.0.0.1' }
});
module.exports = { createMemoryDb };
