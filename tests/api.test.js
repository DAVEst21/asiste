const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('events');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { createMemoryDb } = require('../scripts/memory-db');
const { seedDemo, accounts, groups, students, PASSWORD, TAG } = require('../scripts/demo-data');
const { createApp } = require('../backend/app');
const Usuario = require('../backend/models/Usuario');
const Alumno = require('../backend/models/Alumno');
const Grupo = require('../backend/models/Grupo');
const Asistencia = require('../backend/models/Asistencia');

const secret = 'test-only-secret-asiste-never-use-in-production';
let database, server, base, admin, docente, docente2, alumno, alumno2;
async function request(path, { method = 'GET', token, body } = {}) {
    const res = await fetch(`${base}${path}`, { method, headers: {
        'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {})
    }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, body: await res.json() };
}
async function login(email, password = PASSWORD) {
    const result = await request('/auth/login', { method: 'POST', body: { email, password } });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return result.body.token;
}
before(async () => {
    database = await createMemoryDb('asiste_demo');
    await mongoose.connect(database.getUri('asiste_demo'));
    await Promise.all([Usuario.init(), Alumno.init(), Grupo.init(), Asistencia.init()]);
    await seedDemo();
    server = createApp({ jwtSecret: secret }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${server.address().port}/api`;
    [admin, docente, docente2, alumno, alumno2] = await Promise.all([
        login(accounts[0].email), login(accounts[1].email), login(accounts[2].email), login('DEMO-1'), login('DEMO-2')
    ]);
}, { timeout: 180000 });
after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    if (database) await database.stop();
});

test('login de los tres roles, contraseña incorrecta e inyección de objetos', async () => {
    for (const [email, rol] of [[accounts[0].email, 'admin'], [accounts[1].email, 'docente'], ['DEMO-1', 'alumno']]) {
        const result = await request('/auth/login', { method: 'POST', body: { email, password: PASSWORD } });
        assert.equal(result.status, 200); assert.equal(result.body.rol, rol); assert.equal(result.body.password, undefined);
    }
    assert.equal((await request('/auth/login', { method: 'POST', body: { email: accounts[0].email, password: 'wrong' } })).status, 401);
    assert.equal((await request('/auth/login', { method: 'POST', body: { email: { $ne: null }, password: PASSWORD } })).status, 400);
});
test('registro público: rechaza alta normal, admin y roles manipulados sin crear cuentas', async () => {
    const count = await Usuario.countDocuments();
    for (const rol of [undefined, 'docente', 'admin', { $ne: null }]) {
        assert.equal((await request('/auth/register', { method: 'POST', body: { nombre: 'Intento', email: 'new@example.test', password: PASSWORD, rol } })).status, 403);
    }
    assert.equal(await Usuario.countDocuments(), count);
});
test('autenticación: rechaza token ausente, corrupto, expirado, con firma ajena y cuenta eliminada', async () => {
    const sign = (payload, options = {}, key = secret) => jwt.sign(payload, key, { issuer: 'asiste', audience: 'asiste-web', ...options });
    for (const token of [undefined, 'invalid', sign({ id: String(accounts[0]._id), rol: 'admin' }, { expiresIn: -1 }),
        sign({ id: String(accounts[0]._id), rol: 'admin' }, {}, 'other-secret'), sign({ id: '000000000000000000009999', rol: 'admin' })]) {
        assert.equal((await request('/admin/docentes', { token })).status, 401);
    }
});
test('rol actualizado en BD invalida privilegios del token anterior', async () => {
    const user = await Usuario.create({ nombre: 'Temporal', email: 'role@example.test', password: PASSWORD, rol: 'admin' });
    const token = await login(user.email);
    user.rol = 'docente'; await user.save();
    assert.equal((await request('/admin/docentes', { token })).status, 401);
    await user.deleteOne();
});
test('admin: permite administrar y rechaza GET y escrituras de docente/alumno', async () => {
    for (const token of [docente, alumno]) {
        for (const resource of ['docentes', 'alumnos', 'grupos']) {
            assert.equal((await request(`/admin/${resource}`, { token })).status, 403);
            assert.equal((await request(`/admin/${resource}`, { token, method: 'POST', body: {} })).status, 403);
        }
    }
    for (const resource of ['docentes', 'alumnos', 'grupos']) {
        const result = await request(`/admin/${resource}`, { token: admin });
        assert.equal(result.status, 200);
        assert.ok(result.body.every(row => !('password' in row)));
    }
});
test('docentes: listado de grupos propio y acceso por recurso, incluidos reportes/estadísticas', async () => {
    const result = await request('/grupos', { token: docente });
    assert.deepEqual(result.body.map(row => row.nombre), ['DEMO-A']);
    for (const path of [`/grupos/${groups[1]._id}/alumnos`, `/reportes/grupo/${groups[1]._id}`,
        `/estadisticas/grupo/${groups[1]._id}`, `/asistencias/grupo/${groups[1]._id}/fecha/2030-01-01`]) {
        assert.equal((await request(path, { token: docente })).status, 403, path);
        assert.equal((await request(path, { token: docente2 })).status, 200, path);
        assert.equal((await request(path, { token: admin })).status, 200, path);
    }
});
test('alumnos: solo su fila de reporte e historial, sin acceso a compañeros ni a otros grupos', async () => {
    const result = await request(`/reportes/grupo/${groups[0]._id}`, { token: alumno });
    assert.equal(result.status, 200); assert.equal(result.body.length, 1);
    assert.equal(result.body[0]._id, String(students[0]._id));
    const history = await request(`/student/history?alumno_id=${students[1]._id}`, { token: alumno });
    assert.ok(history.body.length > 0);
    assert.ok(history.body.every(row => row.alumno_id === String(students[0]._id)));
    assert.equal((await request(`/reportes/grupo/${groups[1]._id}`, { token: alumno })).status, 403);
    for (const path of ['/grupos', `/grupos/${groups[0]._id}/alumnos`, `/estadisticas/grupo/${groups[0]._id}`,
        `/asistencias/grupo/${groups[0]._id}/fecha/2030-01-01`]) {
        assert.equal((await request(path, { token: alumno })).status, 403, path);
    }
    assert.equal((await request('/student/history', { token: docente })).status, 403);
});
test('asistencia: guarda un lote y permite corregirlo sin duplicar registros', async () => {
    const payload = { grupo_id: String(groups[0]._id), fecha: '2030-01-01', asistencias: students.slice(0, 3).map((row, i) => ({
        alumno_id: String(row._id), estado: ['presente', 'retardo', 'falta'][i]
    })) };
    assert.equal((await request('/asistencias', { method: 'POST', token: docente, body: payload })).status, 200);
    assert.equal((await request('/asistencias', { method: 'POST', token: docente, body: payload })).status, 200);
    assert.equal(await Asistencia.countDocuments({ grupo_id: groups[0]._id, fecha: new Date('2030-01-01') }), 3);
    const report = await request(`/reportes/grupo/${groups[0]._id}?startDate=2030-01-01&endDate=2030-01-01`, { token: docente });
    assert.deepEqual(report.body.map(row => row.porcentaje).sort((a, b) => a - b), [0, 100, 100]);
    payload.asistencias[2].estado = 'presente';
    assert.equal((await request('/asistencias', { method: 'POST', token: docente, body: payload })).status, 200);
    const read = await request(`/asistencias/grupo/${groups[0]._id}/fecha/2030-01-01`, { token: docente });
    assert.equal(read.body.find(row => row.alumno_id._id === String(students[2]._id)).estado, 'presente');
});
test('asistencia: impide escribir a alumno y docente ajeno', async () => {
    const body = { grupo_id: String(groups[0]._id), fecha: '2030-01-02', asistencias: [{ alumno_id: String(students[0]._id), estado: 'presente' }] };
    for (const token of [alumno, docente2]) assert.equal((await request('/asistencias', { method: 'POST', token, body })).status, 403);
    assert.equal(await Asistencia.countDocuments({ fecha: new Date('2030-01-02') }), 0);
});
test('asistencia: conserva notas omitidas y rechaza duplicados con distinta capitalización del ID', async () => {
    const body = { grupo_id: String(groups[0]._id), fecha: '2030-01-04', asistencias: [
        { alumno_id: String(students[0]._id), estado: 'presente', observaciones: 'Nota de prueba' }
    ] };
    assert.equal((await request('/asistencias', { method: 'POST', token: docente, body })).status, 200);
    delete body.asistencias[0].observaciones;
    body.asistencias[0].estado = 'retardo';
    assert.equal((await request('/asistencias', { method: 'POST', token: docente, body })).status, 200);
    const record = await Asistencia.findOne({ alumno_id: students[0]._id, fecha: new Date(body.fecha) });
    assert.equal(record.observaciones, 'Nota de prueba');
    body.asistencias.push({ ...body.asistencias[0], alumno_id: String(students[0]._id).toUpperCase() });
    assert.equal((await request('/asistencias', { method: 'POST', token: docente, body })).status, 400);
});
test('asistencia: valida todo el lote antes de escribir, incluso alumnos de otro grupo', async () => {
    const baseBody = { grupo_id: String(groups[0]._id), fecha: '2030-01-03' };
    const valid = { alumno_id: String(students[0]._id), estado: 'presente' };
    for (const [asistencias, status] of [[[], 400], [[valid, valid], 400], [[valid, { alumno_id: String(students[3]._id), estado: 'presente' }], 403],
        [[valid, { alumno_id: String(students[1]._id), estado: 'desconocido' }], 400], [[{ ...valid, observaciones: 42 }], 400]]) {
        assert.equal((await request('/asistencias', { method: 'POST', token: docente, body: { ...baseBody, asistencias } })).status, status);
        assert.equal(await Asistencia.countDocuments({ fecha: new Date(baseBody.fecha) }), 0);
    }
    assert.equal((await request('/asistencias', { method: 'POST', token: docente, body: { ...baseBody, fecha: '2030-02-30', asistencias: [valid] } })).status, 400);
});
test('IDs, fechas y rutas inválidos producen errores JSON controlados', async () => {
    assert.equal((await request('/grupos/not-an-id/alumnos', { token: docente })).status, 400);
    assert.equal((await request('/grupos/000000000000000000009999/alumnos', { token: docente })).status, 404);
    for (const query of ['startDate=2030-01-02', 'startDate=2030-02-01&endDate=2030-01-01', 'startDate=bad&endDate=bad']) {
        assert.equal((await request(`/reportes/grupo/${groups[0]._id}?${query}`, { token: docente })).status, 400);
    }
    assert.equal((await request('/does-not-exist')).status, 404);
});
test('admin CRUD: fija rol docente, filtra password y conserva hashes al editar nombre', async () => {
    const result = await request('/admin/docentes', { token: admin, method: 'POST', body: {
        nombre: 'Docente Temporal', email: 'temporary@example.test', password: PASSWORD, rol: 'admin'
    } });
    assert.equal(result.status, 201); assert.equal(result.body.rol, 'docente'); assert.equal(result.body.password, undefined);
    const user = await Usuario.findById(result.body._id).select('+password');
    assert.notEqual(user.password, PASSWORD); assert.equal(await user.matchPassword(PASSWORD), true);
    assert.equal((await request(`/admin/docentes/${user._id}`, { token: admin, method: 'PUT', body: { nombre: 'Nombre Editado', rol: 'admin' } })).status, 200);
    const edited = await Usuario.findById(user._id).select('+password');
    assert.equal(edited.password, user.password); assert.equal(edited.rol, 'docente');
    assert.equal((await request(`/admin/docentes/${user._id}`, { token: admin, method: 'DELETE' })).status, 200);
});
test('admin CRUD: crea/edita/elimina un grupo y alumno sin historial', async () => {
    const group = await request('/admin/grupos', { token: admin, method: 'POST', body: { nombre: 'Temporal', materia: 'Prueba', docente_id: String(accounts[1]._id) } });
    assert.equal(group.status, 201);
    const student = await request('/admin/alumnos', { token: admin, method: 'POST', body: { nombre: 'Alumno Temporal', matricula: 'TEMP', grupo_id: group.body._id, password: PASSWORD } });
    assert.equal(student.status, 201); assert.equal(student.body.password, undefined);
    assert.equal((await request(`/admin/alumnos/${student.body._id}`, { token: admin, method: 'PUT', body: { nombre: 'Alumno Editado' } })).status, 200);
    assert.equal((await request(`/admin/grupos/${group.body._id}`, { token: admin, method: 'DELETE' })).status, 409);
    assert.equal((await request(`/admin/alumnos/${student.body._id}`, { token: admin, method: 'DELETE' })).status, 200);
    assert.equal((await request(`/admin/grupos/${group.body._id}`, { token: admin, method: 'PUT', body: { nombre: 'Editado' } })).status, 200);
    assert.equal((await request(`/admin/grupos/${group.body._id}`, { token: admin, method: 'DELETE' })).status, 200);
});
test('integridad: protege historial, referencias y la cuenta administradora', async () => {
    assert.equal((await request(`/admin/docentes/${accounts[0]._id}`, { token: admin, method: 'DELETE' })).status, 404);
    assert.equal((await request(`/admin/docentes/${accounts[1]._id}`, { token: admin, method: 'DELETE' })).status, 409);
    assert.equal((await request(`/admin/alumnos/${students[0]._id}`, { token: admin, method: 'DELETE' })).status, 409);
    assert.equal((await request(`/admin/alumnos/${students[0]._id}`, { token: admin, method: 'PUT', body: { grupo_id: String(groups[1]._id) } })).status, 409);
    assert.equal((await request('/admin/grupos', { token: admin, method: 'POST', body: { nombre: 'Invalid', materia: 'Invalid', docente_id: String(accounts[0]._id) } })).status, 404);
});
test('contraseña: exige la actual, valida longitud y solo modifica al alumno autenticado', async () => {
    const second = await Alumno.findById(students[1]._id).select('+password');
    for (const [currentPassword, newPassword, status] of [['wrong', 'NuevaDemo2026!', 400], [PASSWORD, '123', 400], [PASSWORD, 'NuevaDemo2026!', 200]]) {
        assert.equal((await request('/student/password', { token: alumno, method: 'PUT', body: { currentPassword, newPassword, alumno_id: String(students[1]._id) } })).status, status);
    }
    await login('DEMO-1', 'NuevaDemo2026!');
    assert.equal((await Alumno.findById(students[1]._id).select('+password')).password, second.password);
});
test('demo: se repite sin borrar información ni reiniciar contraseñas/capturas', async () => {
    const user = await Alumno.findById(students[0]._id).select('+password');
    const attendance = await Asistencia.countDocuments();
    const extra = await Usuario.create({ nombre: 'Se conserva', email: 'preserve@example.test', password: PASSWORD, rol: 'docente' });
    const result = await seedDemo();
    assert.equal(result.created, 0); assert.equal(await Asistencia.countDocuments(), attendance);
    assert.equal((await Alumno.findById(user._id).select('+password')).password, user.password);
    assert.ok(await Usuario.exists({ _id: extra._id }));
});
test('demo: rechaza colisiones y bases ajenas antes de insertar', async () => {
    await Usuario.updateOne({ _id: accounts[0]._id }, { $unset: { demoTag: 1 } });
    const count = await Usuario.countDocuments();
    await assert.rejects(() => seedDemo(), /datos ajenos/);
    assert.equal(await Usuario.countDocuments(), count);
    await Usuario.updateOne({ _id: accounts[0]._id }, { $set: { demoTag: TAG } });
    const name = mongoose.connection.name;
    try { mongoose.connection.name = 'asiste_personal'; await assert.rejects(() => seedDemo(), /solamente/); }
    finally { mongoose.connection.name = name; }
});
