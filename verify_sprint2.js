// Node 20+ tiene fetch nativo global. No requiere import.

async function runVerification() {
    const baseUrl = 'http://localhost:3000/api';

    console.log('1. Probando Login...');
    try {
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'docente@example.test',
                password: '123'
            })
        });

        if (!loginRes.ok) {
            console.error('Login Fallido:', await loginRes.text());
            process.exit(1);
        }

        const loginData = await loginRes.json();
        console.log('Login Exitoso. Token recibido.');
        const token = loginData.token;

        console.log('2. Probando Obtener Grupos...');
        const gruposRes = await fetch(`${baseUrl}/grupos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!gruposRes.ok) {
            console.error('Get Grupos Fallido:', await gruposRes.text());
            process.exit(1);
        }

        const gruposData = await gruposRes.json();
        console.log(`Grupos obtenidos: ${gruposData.length}`);

        if (gruposData.length > 0) {
            console.log('Primer grupo:', gruposData[0].nombre, gruposData[0].materia);
        }

        console.log('=== VERIFICACIÓN EXITOSA ===');
        process.exit(0);

    } catch (error) {
        console.error('Error de red o ejecución:', error);
        process.exit(1);
    }
}

runVerification();
