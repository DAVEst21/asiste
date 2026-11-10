import React, { useState, useEffect, useContext } from 'react';
import { School, Settings, LogOut } from 'lucide-react';
import { AuthContext } from '../auth/AuthContext';
import { StudentRepository, AttendanceRepository } from '../api/repository';

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [report, setReport] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const [rows, records] = await Promise.all([
                    AttendanceRepository.getReport(user.grupo_id), StudentRepository.getMyHistory()
                ]);
                if (active) { setReport(rows[0] || null); setHistory(records); }
            } catch (e) { if (active) setError(e.message); }
            finally { if (active) setLoading(false); }
        };
        load();
        return () => { active = false; };
    }, [user.grupo_id]);

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
                    <span className="font-bold text-slate-800">Asiste · Alumno</span>
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

                {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
                {loading && <p role="status">Cargando información...</p>}
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
                ) : !loading && !error && <p className="text-center text-slate-500 mt-10">Aún no hay asistencias registradas. Tu docente podrá registrar la primera clase.</p>}

                {/* Password Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                            <h3 className="text-lg font-bold mb-4">Cambiar Contraseña</h3>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium" htmlFor="field-3">Contraseña Actual</label>
                                    <input id="field-3" type="password" required className="w-full border rounded p-2"
                                        value={passData.current} onChange={e => setPassData({ ...passData, current: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium" htmlFor="field-4">Nueva Contraseña</label>
                                    <input id="field-4" type="password" required minLength={8} className="w-full border rounded p-2"
                                        value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium" htmlFor="field-5">Confirmar Nueva</label>
                                    <input id="field-5" type="password" required className="w-full border rounded p-2"
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

export default StudentDashboard;
