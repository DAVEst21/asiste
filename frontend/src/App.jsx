import React, { useState, lazy, Suspense } from 'react';
import { AuthContext } from './auth/AuthContext';
import LoginScreen from './components/LoginScreen';
const AdminDashboard = lazy(() => import('./dashboards/AdminDashboard'));
const DocenteDashboard = lazy(() => import('./dashboards/DocenteDashboard'));
const StudentDashboard = lazy(() => import('./dashboards/StudentDashboard'));

function savedSession() {
    try {
        const value = JSON.parse(sessionStorage.getItem('asiste_user'));
        if (value?.token && ['admin', 'docente', 'alumno'].includes(value.rol)) return value;
    } catch { /* Una sesión corrupta no debe impedir iniciar sesión. */ }
    sessionStorage.removeItem('asiste_user');
    return null;
}
export default function App() {
    const [user, setUser] = useState(savedSession);
    const login = value => { sessionStorage.setItem('asiste_user', JSON.stringify(value)); setUser(value); };
    const logout = () => { sessionStorage.removeItem('asiste_user'); setUser(null); };
    return <AuthContext.Provider value={{ user, login, logout }}>
        <Suspense fallback={<p role="status" className="p-8 text-slate-600">Cargando panel...</p>}>
        {!user && <LoginScreen />}
        {user?.rol === 'admin' && <AdminDashboard />}
        {user?.rol === 'docente' && <DocenteDashboard />}
        {user?.rol === 'alumno' && <StudentDashboard />}
        </Suspense>
    </AuthContext.Provider>;
}
