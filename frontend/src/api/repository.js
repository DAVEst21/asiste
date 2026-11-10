const getHeader = () => {
    const user = JSON.parse(sessionStorage.getItem('asiste_user'));
    return {
        'Content-Type': 'application/json',
        'Authorization': user ? `Bearer ${user.token}` : ''
    };
};

const handleResponse = async (res) => {
    if (!res.ok) {
        if (res.status === 401) {
            sessionStorage.removeItem('asiste_user');
            window.location.reload();
            throw new Error('Sesión expirada');
        }
        const data = await res.json();
        throw new Error(data.message || 'Error en la petición');
    }
    return res.json();
};

export const AuthRepository = {
    login: async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return handleResponse(res);
    }
};

export const GroupRepository = {
    getByDocente: async () => {
        const res = await fetch('/api/grupos', { headers: getHeader() });
        return handleResponse(res);
    }
};

export const StudentRepository = {
    getByGroup: async (groupId) => {
        const res = await fetch(`/api/grupos/${groupId}/alumnos`, { headers: getHeader() });
        return handleResponse(res);
    },
    // Nuevos métodos para propias gestiones
    getMyHistory: async () => {
        const res = await fetch('/api/student/history', { headers: getHeader() });
        return handleResponse(res);
    },
    changePassword: async (currentPassword, newPassword) => {
        const res = await fetch('/api/student/password', {
            method: 'PUT',
            headers: getHeader(),
            body: JSON.stringify({ currentPassword, newPassword })
        });
        return handleResponse(res);
    }
};

export const AttendanceRepository = {
    getByGroupAndDate: async (groupId, date) => {
        const res = await fetch(`/api/asistencias/grupo/${groupId}/fecha/${date}`, { headers: getHeader() });
        return handleResponse(res);
    },
    saveOrUpdateBatch: async (groupId, date, asistencias) => {
        const res = await fetch('/api/asistencias', {
            method: 'POST',
            headers: getHeader(),
            body: JSON.stringify({
                grupo_id: groupId,
                fecha: date,
                asistencias
            })
        });
        return handleResponse(res);
    },
    getReport: async (groupId, startDate, endDate) => {
        let url = `/api/reportes/grupo/${groupId}`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const res = await fetch(url, { headers: getHeader() });
        const data = await handleResponse(res);
        return data.map(d => ({
            ...d,
            total_clases: d.totalClases,
            porcentaje_asistencia: Math.round(d.porcentaje),
            alumno: {
                _id: d._id,
                nombre: d.nombre,
                matricula: d.matricula,
                apellido: ''
            }
        }));
    }
};

export const StatsRepository = {
    getGroupStats: async (groupId) => {
        const res = await fetch(`/api/estadisticas/grupo/${groupId}`, { headers: getHeader() });
        return handleResponse(res);
    }
};

export const AdminRepository = {
    // Docentes
    getDocentes: async () => handleResponse(await fetch('/api/admin/docentes', { headers: getHeader() })),
    createDocente: async (data) => handleResponse(await fetch('/api/admin/docentes', { method: 'POST', headers: getHeader(), body: JSON.stringify(data) })),
    updateDocente: async (id, data) => handleResponse(await fetch(`/api/admin/docentes/${id}`, { method: 'PUT', headers: getHeader(), body: JSON.stringify(data) })),
    deleteDocente: async (id) => handleResponse(await fetch(`/api/admin/docentes/${id}`, { method: 'DELETE', headers: getHeader() })),

    // Alumnos
    getAlumnos: async () => handleResponse(await fetch('/api/admin/alumnos', { headers: getHeader() })),
    createAlumno: async (data) => handleResponse(await fetch('/api/admin/alumnos', { method: 'POST', headers: getHeader(), body: JSON.stringify(data) })),
    updateAlumno: async (id, data) => handleResponse(await fetch(`/api/admin/alumnos/${id}`, { method: 'PUT', headers: getHeader(), body: JSON.stringify(data) })),
    deleteAlumno: async (id) => handleResponse(await fetch(`/api/admin/alumnos/${id}`, { method: 'DELETE', headers: getHeader() })),

    // Grupos
    getGrupos: async () => handleResponse(await fetch('/api/admin/grupos', { headers: getHeader() })),
    createGrupo: async (data) => handleResponse(await fetch('/api/admin/grupos', { method: 'POST', headers: getHeader(), body: JSON.stringify(data) })),
    updateGrupo: async (id, data) => handleResponse(await fetch(`/api/admin/grupos/${id}`, { method: 'PUT', headers: getHeader(), body: JSON.stringify(data) })),
    deleteGrupo: async (id) => handleResponse(await fetch(`/api/admin/grupos/${id}`, { method: 'DELETE', headers: getHeader() })),
};
