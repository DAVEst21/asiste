const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getConfig } = require('../backend/config/env');
const { dateOnly, password } = require('../backend/utils/http');

test('configuración: rechaza secretos ausentes/cortos y exige base explícita', () => {
    const valid = { MONGO_URI: 'mongodb://127.0.0.1:27017/asiste_demo', JWT_SECRET: 's'.repeat(48) };
    assert.equal(getConfig(valid).port, 3000);
    for (const change of [{ JWT_SECRET: '' }, { JWT_SECRET: 'short' }, { MONGO_URI: 'mongodb://localhost' },
        { MONGO_URI: 'mongodb://localhost/admin' }, { PORT: 'oops' }, { PORT: '65536' }]) {
        assert.throws(() => getConfig({ ...valid, ...change }));
    }
});
test('fechas reales y límites de contraseña, incluidos caracteres multibyte', () => {
    assert.equal(dateOnly('2028-02-29').toISOString(), '2028-02-29T00:00:00.000Z');
    for (const value of ['2026-02-29', '2026-13-01', '2026-11-07T12:00:00Z', null]) assert.throws(() => dateOnly(value));
    assert.equal(password('12345678'), '12345678');
    assert.throws(() => password('123'));
    assert.throws(() => password('á'.repeat(37)));
});
