const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    grupos: [],
    grupoActual: null,
    alumnos: [],
    reporte: []
};

const app = document.getElementById('app');

// --- Utilities ---
const apiCall = async (endpoint, method = 'GET', body = null) => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
    };
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`/api${endpoint}`, config);
    if (res.status === 401) {
        logout();
        throw new Error('Sesión expirada');
    }
    return res.json();
};

// --- Views ---

const LoginView = () => `
    <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6 mt-10">
        <h2 class="text-2xl font-bold mb-4 text-center text-blue-800">AsisteUAZ</h2>
        <form id="loginForm" class="space-y-4">
            <div>
                <label class="block text-gray-700">Email</label>
                <input type="email" id="email" class="w-full border rounded p-2 focus:ring focus:ring-blue-200" required>
            </div>
            <div>
                <label class="block text-gray-700">Contraseña</label>
                <input type="password" id="password" class="w-full border rounded p-2 focus:ring focus:ring-blue-200" required>
            </div>
            <button type="submit" class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition font-semibold">Entrar</button>
        </form>
    </div>
`;

const DashboardView = () => `
    <div class="max-w-6xl mx-auto">
        <header class="flex justify-between items-center bg-white p-4 rounded-lg shadow mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Hola, ${state.user.nombre} 👋</h1>
                <p class="text-sm text-gray-500">Selecciona un grupo</p>
            </div>
            <button id="logoutBtn" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition font-medium">Salir</button>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${state.grupos.map(grupo => `
                <div class="bg-white p-6 rounded-lg shadow hover:shadow-xl transition transform hover:-translate-y-1 border-l-4 border-blue-500">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-bold text-xl text-gray-800">${grupo.nombre}</h3>
                            <p class="text-blue-600 font-medium">${grupo.materia}</p>
                        </div>
                        <span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Sem ${grupo.semestre}</span>
                    </div>

                    <div class="flex gap-2">
                        <button onclick="loadGrupo('${grupo._id}')" class="flex-1 bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100 transition text-sm font-semibold">
                            Cargar Lista
                        </button>
                        <button onclick="loadReporte('${grupo._id}')" class="flex-1 bg-gray-50 text-gray-700 py-2 rounded hover:bg-gray-100 transition text-sm font-semibold border">
                            Ver Reporte
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
`;

const AsistenciaView = () => `
    <div class="max-w-4xl mx-auto">
        <button onclick="render('dashboard')" class="mb-4 text-blue-600 hover:text-blue-800 flex items-center">
            &larr; Volver a Grupos
        </button>

        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-end mb-6 border-b pb-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 group-name">${state.grupoActual.materia} (${state.grupoActual.nombre})</h2>
                    <p class="text-gray-500">Registro de Asistencia</p>
                </div>
                <div class="text-right">
                    <label class="block text-sm text-gray-600 font-medium mb-1">Fecha</label>
                    <input type="date" id="fechaAsistencia" class="border rounded p-2 text-sm bg-gray-50" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>

            <form id="asistenciaForm">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Presente</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Retardo</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Falta</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${state.alumnos.map(alumno => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900">${alumno.nombre}</div>
                                        <div class="text-sm text-gray-500">${alumno.matricula}</div>
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <input type="radio" name="estado_${alumno._id}" value="presente" checked class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300">
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <input type="radio" name="estado_${alumno._id}" value="retardo" class="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300">
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <input type="radio" name="estado_${alumno._id}" value="falta" class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300">
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="mt-6 flex justify-end">
                    <button type="submit" class="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 shadow-md transition font-bold flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                        Guardar Asistencia
                    </button>
                </div>
            </form>
        </div>
    </div>
`;

const ReporteView = () => `
    <div class="max-w-5xl mx-auto">
        <button onclick="render('dashboard')" class="mb-4 text-blue-600 hover:text-blue-800 flex items-center">
            &larr; Volver
        </button>

        <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-6 border-b bg-gray-50">
                <h2 class="text-2xl font-bold text-gray-800">Reporte de Asistencias</h2>
                <p class="text-gray-600">${state.grupoActual.materia} (${state.grupoActual.nombre})</p>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Alumno</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Clases</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-green-600 uppercase tracking-wider">Asistencias</th>
                             <th class="px-6 py-3 text-center text-xs font-bold text-yellow-600 uppercase tracking-wider">Retardos</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-red-600 uppercase tracking-wider">Faltas</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider">% Cumplimiento</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${state.reporte.map(item => {
    const porcentaje = parseFloat(item.porcentaje).toFixed(1);
    const alerta = porcentaje < 80 ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-900';
    return `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900">${item.nombre}</div>
                                        <div class="text-sm text-gray-500">${item.matricula}</div>
                                    </td>
                                    <td class="px-6 py-4 text-center text-sm text-gray-500">${item.totalClases}</td>
                                    <td class="px-6 py-4 text-center text-sm text-gray-500">${item.presentes}</td>
                                     <td class="px-6 py-4 text-center text-sm text-gray-500">${item.retardos}</td>
                                    <td class="px-6 py-4 text-center text-sm text-gray-500">${item.faltas}</td>
                                    <td class="px-6 py-4 text-center whitespace-nowrap">
                                        <span class="px-2 py-1 rounded inline-block w-16 text-center ${alerta}">
                                            ${porcentaje}%
                                        </span>
                                    </td>
                                </tr>
                            `;
}).join('')}
                    </tbody>
                </table>
            </div>
            ${state.reporte.length === 0 ? '<p class="p-6 text-center text-gray-500">No hay registros de asistencia aún.</p>' : ''}
        </div>
    </div>
`;

// --- Logic ---

const render = async (viewName = 'login') => {
    app.innerHTML = '<div class="flex justify-center items-center h-64"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>';

    // Add simple logging
    console.log('Rendering view:', viewName);

    try {
        if (state.token) {
            if (viewName === 'dashboard') {
                try {
                    state.grupos = await apiCall('/grupos');
                    app.innerHTML = DashboardView();
                    document.getElementById('logoutBtn').addEventListener('click', logout);
                } catch (e) {
                    console.error('Error fetching groups:', e);
                    logout();
                }
            } else if (viewName === 'asistencia') {
                app.innerHTML = AsistenciaView();
                document.getElementById('asistenciaForm').addEventListener('submit', handleAsistenciaSubmit);
            } else if (viewName === 'reporte') {
                app.innerHTML = ReporteView();
            }
        } else {
            app.innerHTML = LoginView();
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
        }
    } catch (err) {
        console.error('Render error:', err);
        app.innerHTML = '<p class="text-red-500 text-center">Error cargando aplicación. Revisa la consola.</p>';
    }
};

window.loadGrupo = async (grupoId) => {
    state.grupoActual = state.grupos.find(g => g._id === grupoId);
    try {
        state.alumnos = await apiCall(`/grupos/${grupoId}/alumnos`);
        render('asistencia');
    } catch (e) {
        alert('Error cargando alumnos');
    }
};

window.loadReporte = async (grupoId) => {
    state.grupoActual = state.grupos.find(g => g._id === grupoId);
    try {
        state.reporte = await apiCall(`/reportes/grupo/${grupoId}`);
        render('reporte');
    } catch (e) {
        alert('Error cargando reporte');
    }
};

const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            state.user = data;
            state.token = data.token;
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            render('dashboard');
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error conectando al servidor');
    }
};

const handleAsistenciaSubmit = async (e) => {
    e.preventDefault();
    const fecha = document.getElementById('fechaAsistencia').value;

    const asistencias = state.alumnos.map(alumno => {
        const radios = document.getElementsByName(`estado_${alumno._id}`);
        let estado = 'presente';
        for (const r of radios) {
            if (r.checked) estado = r.value;
        }
        return {
            alumno_id: alumno._id,
            estado
        };
    });

    try {
        const res = await apiCall('/asistencias', 'POST', {
            grupo_id: state.grupoActual._id,
            fecha,
            asistencias
        });

        if (res.message) {
            alert(res.message);
            render('dashboard');
        } else {
            alert('Guardado!');
            render('dashboard');
        }
    } catch (error) {
        alert('Error guardando asistencia: ' + error.message);
    }
};

const logout = () => {
    state.user = null;
    state.token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    render('login');
};

// Init
try {
    render(state.token ? 'dashboard' : 'login');
} catch (e) {
    console.error('Init error:', e);
}
