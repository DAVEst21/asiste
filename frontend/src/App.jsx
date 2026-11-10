import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import {
    Users,
    Calendar,
    BarChart3,
    LogOut,
    CheckCircle,
    XCircle,
    Clock,
    Dashboard as DashboardIcon,
    Settings,
    UserPlus,
    School,
    Trash2,
    Edit2,
    FileDown,
    Save
} from 'lucide-react';
import { AuthRepository, GroupRepository, StudentRepository, AttendanceRepository, StatsRepository, AdminRepository } from './api/repository';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * ==========================================
 * CAPA DE PRESENTACIÓN (REACT COMPONENTS)
 * ==========================================
 */

// Contexto de Autenticación
const AuthContext = createContext(null);

// Componente: Tarjeta de Estadística
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
    </div>
);

// Pantalla: Login
const LoginScreen = () => {
    const { login } = useContext(AuthContext);
    const [identifier, setIdentifier] = useState(''); // Email o Matricula
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = await AuthRepository.login(identifier, password);
            login(user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-blue-600 p-3 rounded-xl">
                        <School className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900">AsisteLocal</h2>
                <p className="mt-2 text-sm text-slate-600">Gestión Académica Integral</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email o Matrícula</label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="usuario@uaz.edu.mx"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Componente: Lista de Alumnos para Asistencia
const AttendanceRow = ({ alumno, status, onUpdate }) => {
    const statusConfig = {
        presente: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Presente' },
        falta: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Falta' },
        retardo: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Retardo' }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                    {alumno.nombre.charAt(0)}
                </div>
                <div>
                    <p className="font-medium text-slate-900">{alumno.nombre}</p>
                    <p className="text-xs text-slate-500">{alumno.matricula}</p>
                </div>
            </div>
            <div className="flex space-x-2">
                {Object.keys(statusConfig).map((key) => {
                    const config = statusConfig[key];
                    const Icon = config.icon;
                    const isActive = status === key;
                    return (
                        <button
                            key={key}
                            onClick={() => onUpdate(alumno._id, key)}
                            className={`p-2 rounded-lg transition-all ${isActive ? config.color + ' ring-2 ring-offset-1 ring-slate-200' : 'text-slate-400 hover:bg-slate-100'}`}
                            title={config.label}
                        >
                            <Icon className="w-5 h-5" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// --- STUDENT VIEW ---
const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [report, setReport] = useState(null);
    const [history, setHistory] = useState([]);
    const [viewHistory, setViewHistory] = useState(false);

    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

    useEffect(() => {
        const loadMyStats = async () => {
            if (!user.grupo_id) return;
            try {
                const fullReport = await AttendanceRepository.getReport(user.grupo_id);
                const myReport = fullReport.find(r => r.alumno._id === user._id);
                setReport(myReport);

                const myHistory = await StudentRepository.getMyHistory();
                setHistory(myHistory);
            } catch (e) { console.error(e); }
        };
        loadMyStats();
    }, [user]);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passData.new !== passData.confirm) return alert('Las contraseñas no coinciden');

        try {
            await StudentRepository.changePassword(passData.current, passData.new);
            alert('Contraseña actualizada');
            setShowPasswordModal(false);
            setPassData({ current: '', new: '', confirm: '' });
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white shadow h-16 flex items-center justify-between px-6">
                <div className="flex items-center space-x-2">
                    <School className="text-blue-600" />
                    <span className="font-bold text-slate-800">Panel de Alumno</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{user.nombre}</span>
                    <button onClick={() => setShowPasswordModal(true)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                        <Settings className="w-4 h-4 mr-1" /> Contraseña
                    </button>
                    <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 flex items-center">
                        <LogOut className="w-4 h-4 mr-1" /> Salir
                    </button>
                </div>
            </header>
            <main className="p-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Mi Asistencia</h2>
                    <p className="text-slate-500">Matrícula: {user.matricula}</p>
                </div>

                {report ? (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow border border-slate-100 flex flex-col items-center justify-center">
                                <span className="text-slate-500 font-medium mb-2">Porcentaje Global</span>
                                <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-slate-100">
                                    <span className={`text-3xl font-bold ${report.porcentaje_asistencia >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                                        {report.porcentaje_asistencia}%
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg flex justify-between">
                                    <span className="font-medium text-blue-700">Clases Totales</span>
                                    <span className="font-bold text-blue-900">{report.total_clases}</span>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg flex justify-between">
                                    <span className="font-medium text-red-700">Faltas</span>
                                    <span className="font-bold text-red-900">{report.faltas}</span>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg flex justify-between">
                                    <span className="font-medium text-yellow-700">Retardos</span>
                                    <span className="font-bold text-yellow-900">{report.retardos}</span>
                                </div>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200">
                                <h3 className="font-bold text-slate-700">Historial Detallado</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Estado</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Observación</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {history.map((record, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 text-sm text-slate-900">
                                                    {new Date(record.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {record.estado === 'presente' && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Presente</span>}
                                                    {record.estado === 'falta' && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Falta</span>}
                                                    {record.estado === 'retardo' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Retardo</span>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 italic">
                                                    {record.observaciones || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {history.length === 0 && <p className="p-4 text-center text-slate-500">No hay registros aún</p>}
                            </div>
                        </div>

                    </div>
                ) : <p className="text-center text-slate-500 mt-10">Cargando información...</p>}

                {/* Password Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                            <h3 className="text-lg font-bold mb-4">Cambiar Contraseña</h3>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Contraseña Actual</label>
                                    <input type="password" required className="w-full border rounded p-2"
                                        value={passData.current} onChange={e => setPassData({ ...passData, current: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Nueva Contraseña</label>
                                    <input type="password" required className="w-full border rounded p-2"
                                        value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Confirmar Nueva</label>
                                    <input type="password" required className="w-full border rounded p-2"
                                        value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })} />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setShowPasswordModal(false)} className="text-slate-500">Cancelar</button>
                                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- ADMIN DASHBOARD ---
// --- ADMIN DASHBOARD ---
const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [section, setSection] = useState('docentes'); // docentes, alumnos, grupos
    const [data, setData] = useState([]);
    const [auxData, setAuxData] = useState({ groups: [], teachers: [] }); // Update for Dropdowns

    // CRUD State
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});

    // Cargar datos
    useEffect(() => {
        loadData();
    }, [section]);

    const loadData = async () => {
        try {
            let res = [];
            // Cargar datos principales y auxiliares según sección
            if (section === 'docentes') {
                res = await AdminRepository.getDocentes();
            }
            if (section === 'alumnos') {
                res = await AdminRepository.getAlumnos();
                // Cargar grupos para el dropdown
                const g = await AdminRepository.getGrupos();
                setAuxData(prev => ({ ...prev, groups: g }));
            }
            if (section === 'grupos') {
                res = await AdminRepository.getGrupos();
                // Cargar docentes para el dropdown
                const t = await AdminRepository.getDocentes();
                setAuxData(prev => ({ ...prev, teachers: t }));
            }
            setData(res);
        } catch (e) {
            alert('Error cargando datos: ' + e.message);
        }
    };

    // Actions
    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
        try {
            if (section === 'docentes') await AdminRepository.deleteDocente(id);
            if (section === 'alumnos') await AdminRepository.deleteAlumno(id);
            if (section === 'grupos') await AdminRepository.deleteGrupo(id);
            loadData();
        } catch (e) { alert(e.message); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                if (section === 'docentes') await AdminRepository.updateDocente(currentItem._id, formData);
                if (section === 'alumnos') await AdminRepository.updateAlumno(currentItem._id, formData);
                if (section === 'grupos') await AdminRepository.updateGrupo(currentItem._id, formData);
            } else {
                if (section === 'docentes') await AdminRepository.createDocente(formData);
                if (section === 'alumnos') await AdminRepository.createAlumno(formData);
                if (section === 'grupos') await AdminRepository.createGrupo(formData);
            }
            setShowForm(false);
            loadData();
        } catch (e) { alert(e.message); }
    };

    const openForm = (item = null) => {
        setIsEditing(!!item);
        if (item) {
            setCurrentItem(item);
            // Copiar datos relevantes
            const data = { ...item };
            if (data.docente_id && typeof data.docente_id === 'object') data.docente_id = data.docente_id._id;
            if (data.grupo_id && typeof data.grupo_id === 'object') data.grupo_id = data.grupo_id._id;
            // Limpiar password
            data.password = '';
            setFormData(data);
        } else {
            setFormData({});
            setCurrentItem(null);
        }
        setShowForm(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-700">
                    <span className="font-bold text-lg">Admin Panel</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setSection('docentes')} className={`w-full text-left px-4 py-2 rounded ${section === 'docentes' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Docentes</button>
                    <button onClick={() => setSection('alumnos')} className={`w-full text-left px-4 py-2 rounded ${section === 'alumnos' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Alumnos</button>
                    <button onClick={() => setSection('grupos')} className={`w-full text-left px-4 py-2 rounded ${section === 'grupos' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Grupos</button>
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <button onClick={logout} className="flex items-center text-red-400 hover:text-red-300">
                        <LogOut className="w-4 h-4 mr-2" /> Salir
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold capitalize text-slate-800">{section}</h1>
                    <button onClick={() => openForm()} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center">
                        <UserPlus className="w-4 h-4 mr-2" /> Nuevo
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                                {section === 'docentes' && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>}
                                {section === 'docentes' && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>}

                                {section === 'alumnos' && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>}
                                {section === 'alumnos' && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Matrícula</th>}
                                {section === 'alumnos' && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grupo</th>}

                                {section === 'grupos' && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>}
                                {section === 'grupos' && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Materia</th>}

                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {data.map(item => (
                                <tr key={item._id}>
                                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">{item._id.slice(-6)}</td>

                                    {section === 'docentes' && <td className="px-6 py-4">{item.nombre}</td>}
                                    {section === 'docentes' && <td className="px-6 py-4">{item.email}</td>}

                                    {section === 'alumnos' && <td className="px-6 py-4">{item.nombre}</td>}
                                    {section === 'alumnos' && <td className="px-6 py-4">{item.matricula}</td>}
                                    {section === 'alumnos' && <td className="px-6 py-4">{item.grupo_id?.nombre || 'S/G'}</td>}

                                    {section === 'grupos' && <td className="px-6 py-4">{item.nombre}</td>}
                                    {section === 'grupos' && <td className="px-6 py-4">{item.materia}</td>}

                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => openForm(item)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">{isEditing ? 'Editar' : 'Nuevo'} {section.slice(0, -1)}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            {section !== 'grupos' && (
                                <div>
                                    <label className="block text-sm font-medium">Nombre</label>
                                    <input type="text" className="w-full border rounded p-2" value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
                                </div>
                            )}

                            {/* Campos Docente */}
                            {section === 'docentes' && (
                                <div>
                                    <label className="block text-sm font-medium">Email</label>
                                    <input type="email" className="w-full border rounded p-2" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                            )}

                            {/* Campos Alumno */}
                            {section === 'alumnos' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium">Matrícula</label>
                                        <input type="text" className="w-full border rounded p-2" value={formData.matricula || ''} onChange={e => setFormData({ ...formData, matricula: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Grupo</label>
                                        <select
                                            className="w-full border rounded p-2"
                                            value={formData.grupo_id || ''}
                                            onChange={e => setFormData({ ...formData, grupo_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Selecciona un Grupo...</option>
                                            {auxData.groups.map(g => (
                                                <option key={g._id} value={g._id}>{g.nombre} ({g.materia})</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Campos Grupo */}
                            {section === 'grupos' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium">Nombre del Grupo</label>
                                        <input type="text" className="w-full border rounded p-2" value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required placeholder="Ej. 3A" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Materia</label>
                                        <input type="text" className="w-full border rounded p-2" value={formData.materia || ''} onChange={e => setFormData({ ...formData, materia: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Docente Asignado</label>
                                        <select
                                            className="w-full border rounded p-2"
                                            value={formData.docente_id || ''}
                                            onChange={e => setFormData({ ...formData, docente_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Selecciona un Docente...</option>
                                            {auxData.teachers.map(t => (
                                                <option key={t._id} value={t._id}>{t.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Password (Opcional en Edit) */}
                            {(section !== 'grupos') && (
                                <div>
                                    <label className="block text-sm font-medium">Contraseña {isEditing && '(Dejar vacío para no cambiar)'}</label>
                                    <input type="password" className="w-full border rounded p-2" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!isEditing} />
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


// Pantalla: Dashboard Docente (Existente)
const DocenteDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [view, setView] = useState('home');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groups, setGroups] = useState([]);

    // Estados Home (Stats)
    const [stats, setStats] = useState({ totalAlumnos: 0, clasesImpartidas: 0, promedioAsistencia: 0 });

    // Estados Asistencia
    const [students, setStudents] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState({});
    const [saving, setSaving] = useState(false);

    // Estados Reportes
    const [reportData, setReportData] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        // Cargar grupos del docente al iniciar
        const loadGroups = async () => {
            try {
                const userGroups = await GroupRepository.getByDocente();
                setGroups(userGroups);
                if (userGroups.length > 0) setSelectedGroup(userGroups[0]);
            } catch (e) {
                console.error(e);
            }
        };
        loadGroups();
    }, [user]);

    // Efecto para cargar datos cuando cambia vista o grupo
    useEffect(() => {
        const loadData = async () => {
            if (!selectedGroup) return;

            if (view === 'home') {
                try {
                    const data = await StatsRepository.getGroupStats(selectedGroup._id);
                    setStats(data);
                } catch (e) { console.error(e); }
            }

            if (view === 'attendance') {
                try {
                    const groupStudents = await StudentRepository.getByGroup(selectedGroup._id);
                    setStudents(groupStudents);

                    // Cargar asistencia existente si la hay
                    const prevAttendance = await AttendanceRepository.getByGroupAndDate(selectedGroup._id, attendanceDate);
                    const map = {};
                    // Default: presente
                    groupStudents.forEach(s => map[s._id] = 'presente');
                    // Override con existente
                    prevAttendance.forEach(a => map[a.alumno_id._id || a.alumno_id] = a.estado);
                    setAttendanceData(map);
                } catch (e) { console.error(e); }
            }

            if (view === 'reports') {
                try {
                    const data = await AttendanceRepository.getReport(selectedGroup._id, dateRange.start, dateRange.end);
                    setReportData(data);
                } catch (e) { console.error(e); }
            }
        };
        loadData();
    }, [view, selectedGroup, attendanceDate, dateRange]); // Recarga si cambian filtros

    const handleStatusChange = (studentId, newStatus) => {
        setAttendanceData(prev => ({ ...prev, [studentId]: newStatus }));
    };

    const handleSaveAttendance = async () => {
        setSaving(true);
        try {
            const asistencias = Object.keys(attendanceData).map(studentId => ({
                alumno_id: studentId,
                estado: attendanceData[studentId]
            }));

            await AttendanceRepository.saveOrUpdateBatch(selectedGroup._id, attendanceDate, asistencias);
            alert('Asistencia guardada correctamente');
        } catch (e) {
            alert('Error al guardar: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    // --- Export Functions ---
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Reporte de Asistencias - ${selectedGroup.nombre}`, 14, 15);
        doc.text(`Materia: ${selectedGroup.materia}`, 14, 22);

        const tableColumn = ["Alumno", "Matrícula", "Clases", "Faltas", "Retardos", "% Asist"];
        const tableRows = [];

        reportData.forEach(row => {
            const rowData = [
                row.alumno.nombre,
                row.alumno.matricula,
                row.total_clases,
                row.faltas,
                row.retardos,
                row.porcentaje_asistencia + '%'
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });

        doc.save("reporte_asistencia.pdf");
    };

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData.map(row => ({
            Alumno: row.alumno.nombre,
            Matrícula: row.alumno.matricula,
            "Total Clases": row.total_clases,
            Faltas: row.faltas,
            Retardos: row.retardos,
            "% Asistencia": row.porcentaje_asistencia
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
        XLSX.writeFile(workbook, "reporte_asistencia.xlsx");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <School className="w-8 h-8 text-blue-600 mr-2" />
                    <span className="font-bold text-lg text-slate-800">AsisteLocal</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <button
                        onClick={() => setView('home')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${view === 'home' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Users className="w-5 h-5 mr-3" />
                        Mis Grupos
                    </button>
                    <button
                        onClick={() => setView('attendance')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${view === 'attendance' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <CheckCircle className="w-5 h-5 mr-3" />
                        Pasar Lista
                    </button>
                    <button
                        onClick={() => setView('reports')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${view === 'reports' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <BarChart3 className="w-5 h-5 mr-3" />
                        Reportes
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <div className="px-4 py-2 mb-2">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Usuario</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{user?.nombre}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-8">
                    <h1 className="text-xl font-bold text-slate-800">
                        {view === 'home' && 'Resumen General'}
                        {view === 'attendance' && 'Registro de Asistencia'}
                        {view === 'reports' && 'Reportes Académicos'}
                    </h1>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-slate-500">Grupo Actual:</span>
                        <select
                            value={selectedGroup?._id || ''}
                            onChange={(e) => {
                                const group = groups.find(g => g._id === e.target.value);
                                setSelectedGroup(group);
                            }}
                            className="form-select text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        >
                            <option value="" disabled>Selecciona un grupo</option>
                            {groups.map(g => (
                                <option key={g._id} value={g._id}>{g.nombre}</option>
                            ))}
                        </select>
                    </div>
                </header>

                <div className="p-8">
                    {/* VISTA: HOME */}
                    {view === 'home' && selectedGroup && (
                        <div className="space-y-6">
                            {/* Cabecera Grande de Materia */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
                                <h2 className="text-3xl font-extrabold mb-2">{selectedGroup.materia}</h2>
                                <p className="text-blue-100 text-lg opacity-90">{selectedGroup.nombre} • {user.nombre}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Stats Reales */}
                                <StatCard
                                    title="Total Alumnos"
                                    value={stats.totalAlumnos}
                                    icon={Users}
                                    color="text-blue-600 bg-blue-600"
                                />
                                <StatCard
                                    title="Clases Impartidas"
                                    value={stats.clasesImpartidas}
                                    icon={Calendar}
                                    color="text-purple-600 bg-purple-600"
                                />
                                <StatCard
                                    title="Promedio Asistencia"
                                    value={`${stats.promedioAsistencia}%`}
                                    icon={CheckCircle}
                                    color="text-green-600 bg-green-600"
                                />
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Acciones Rápidas</h3>
                                <p className="text-slate-500">Bienvenido, empieza tomando lista para hoy.</p>
                                <div className="mt-6 flex gap-4">
                                    <button onClick={() => setView('attendance')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                                        Pasar Lista Hoy
                                    </button>
                                    <button onClick={() => setView('reports')} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
                                        Ver Reportes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {view === 'home' && !selectedGroup && (
                        <p>Cargando grupos...</p>
                    )}

                    {/* VISTA: ASISTENCIA */}
                    {view === 'attendance' && selectedGroup && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-5 h-5 text-slate-500" />
                                    <input
                                        type="date"
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                        className="border bg-white rounded p-1 font-semibold text-slate-700 focus:ring-0 cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-slate-500">{students.length} Alumnos</span>
                                    <button
                                        onClick={handleSaveAttendance}
                                        disabled={saving}
                                        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:bg-blue-300">
                                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {students.map(student => (
                                    <AttendanceRow
                                        key={student._id}
                                        alumno={student}
                                        status={attendanceData[student._id]}
                                        onUpdate={handleStatusChange}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VISTA: REPORTES */}
                    {view === 'reports' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Reporte de Inasistencias</h3>
                                        <p className="text-sm text-slate-500">{selectedGroup?.materia}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-end">
                                        <div>
                                            <label className="text-xs text-slate-500 block">Desde</label>
                                            <input type="date" className="border rounded px-2 py-1 text-sm text-gray-700"
                                                value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block">Hasta</label>
                                            <input type="date" className="border rounded px-2 py-1 text-sm text-gray-700"
                                                value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                                        </div>
                                        <div className="flex gap-2 ml-2">
                                            <button onClick={exportPDF} className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                                                <FileDown size={14} /> PDF
                                            </button>
                                            <button onClick={exportExcel} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                                <FileDown size={14} /> Excel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Alumno</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Total Clases</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Faltas</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Retardos</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">% Asistencia</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {reportData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900">{row.alumno.nombre}</div>
                                                                <div className="text-xs text-slate-500">{row.alumno.matricula}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">{row.total_clases}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-medium">{row.faltas}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600">{row.retardos}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center">
                                                            <span className="text-sm font-bold text-slate-700 mr-2">{row.porcentaje_asistencia}%</span>
                                                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${row.porcentaje_asistencia < 80 ? 'bg-red-500' : 'bg-green-500'}`}
                                                                    style={{ width: `${row.porcentaje_asistencia}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {row.porcentaje_asistencia < 80 ? (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                                Riesgo
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                Regular
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {reportData.length === 0 && <p className="p-4 text-center text-slate-500">No hay datos para mostrar</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// App Main Component w/ Role Routing
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check session simulation
        const savedUser = sessionStorage.getItem('asiste_user');
        if (savedUser) setUser(JSON.parse(savedUser));
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        sessionStorage.setItem('asiste_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('asiste_user');
    };

    if (loading) return null;

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {!user && <LoginScreen />}
            {user && user.rol === 'admin' && <AdminDashboard />}
            {user && user.rol === 'docente' && <DocenteDashboard />}
            {user && user.rol === 'alumno' && <StudentDashboard />}
            {user && !['admin', 'docente', 'alumno'].includes(user.rol) && <div className="p-10">Rol desconocido</div>}
        </AuthContext.Provider>
    );
};

export default App;
