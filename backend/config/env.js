function getConfig(env = process.env) {
    if (!env.MONGO_URI || !/^mongodb(?:\+srv)?:\/\//.test(env.MONGO_URI)) {
        throw new Error('Define MONGO_URI con una conexión MongoDB y una base explícita.');
    }
    const database = new URL(env.MONGO_URI).pathname.slice(1);
    if (!database || ['admin', 'local', 'config'].includes(database)) {
        throw new Error('MONGO_URI debe indicar una base de aplicación.');
    }
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET debe contener al menos 32 caracteres.');
    }
    const port = Number(env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT no es válido.');
    return { mongoUri: env.MONGO_URI, jwtSecret: env.JWT_SECRET, port };
}

module.exports = { getConfig };
