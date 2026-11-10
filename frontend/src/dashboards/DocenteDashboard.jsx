import React, { useState, useEffect, useContext } from 'react';
import { School, Users, CheckCircle, Calendar, BarChart3, LogOut, FileDown } from 'lucide-react';
import { AuthContext } from '../auth/AuthContext';
import { GroupRepository, StudentRepository, AttendanceRepository, StatsRepository } from '../api/repository';
import StatCard from '../components/StatCard';
import AttendanceRow from '../components/AttendanceRow';

const DocenteDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [view, setView] = useState('home');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groups, setGroups] = useState([]);

    // Estados Home (Stats)
    const [stats, setStats] = useState({ totalAlumnos: 0, clasesImpartidas: 0, promedioAsistencia: 0 });

    // Estados Asistencia
    const [students, setStudents] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
    const [attendanceData, setAttendanceData] = useState({});
    const [saving, setSaving] = useState(false);

    // Estados Reportes
    const [reportData, setReportData] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        let active = true;
        GroupRepository.getByDocente().then(rows => {
            if (active) { setGroups(rows); setSelectedGroup(rows[0] || null); }
        }).catch(e => { if (active) setError(e.message); })
            .finally(() => { if (active) setLoadingGroups(false); });
        return () => { active = false; };
    }, [user._id]);

    useEffect(() => {
        let active = true;
        if (!selectedGroup) return;
        setLoadingData(true);
        setError('');
        setNotice('');
        const load = async () => {
            try {
                if (view === 'home') {
                    const result = await StatsRepository.getGroupStats(selectedGroup._id);
                    if (active) setStats(result);
                } else if (view === 'attendance') {
                    const [rows, records] = await Promise.all([
                        StudentRepository.getByGroup(selectedGroup._id),
                        AttendanceRepository.getByGroupAndDate(selectedGroup._id, attendanceDate)
                    ]);
                    if (active) {
                        setStudents(rows);
                        const values = Object.fromEntries(rows.map(row => [row._id, 'presente']));
                        records.forEach(record => { values[record.alumno_id?._id || record.alumno_id] = record.estado; });
                        setAttendanceData(values);
                    }
                } else {
                    if (!!dateRange.start !== !!dateRange.end) {
                        if (active) setReportData([]);
                        return;
                    }
                    const rows = await AttendanceRepository.getReport(selectedGroup._id, dateRange.start, dateRange.end);
                    if (active) setReportData(rows);
                }
            } catch (e) { if (active) setError(e.message); }
            finally { if (active) setLoadingData(false); }
        };
        load();
        return () => { active = false; };
    }, [view, selectedGroup, attendanceDate, dateRange]);

    const handleStatusChange = (studentId, newStatus) => {
        setAttendanceData(prev => ({ ...prev, [studentId]: newStatus }));
    };

    const handleSaveAttendance = async () => {
        if (loadingData || !students.length) return;
        setSaving(true);
        setError('');
        try {
            const asistencias = Object.keys(attendanceData).map(studentId => ({
                alumno_id: studentId,
                estado: attendanceData[studentId]
            }));

            await AttendanceRepository.saveOrUpdateBatch(selectedGroup._id, attendanceDate, asistencias);
            setNotice('Asistencia guardada correctamente.');
        } catch (e) {
            setError('Error al guardar: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    // --- Export Functions ---
    const exportPDF = async () => {
        try {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
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
        } catch (e) { setError(`No fue posible exportar el PDF: ${e.message}`); }
    };

    const exportExcel = async () => {
        try {
        const XLSX = await import('xlsx');
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
        } catch (e) { setError(`No fue posible exportar Excel: ${e.message}`); }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <School className="w-8 h-8 text-blue-600 mr-2" />
                    <span className="font-bold text-lg text-slate-800">Asiste</span>
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
            <main className="flex-1 min-w-0 overflow-y-auto">
                <nav aria-label="Navegación móvil" className="md:hidden flex flex-wrap items-center gap-3 p-4 bg-white border-b text-sm">
                    <strong className="text-blue-700">Asiste</strong>
                    <button onClick={() => setView('home')}>Mis Grupos</button>
                    <button onClick={() => setView('attendance')}>Pasar Lista</button>
                    <button onClick={() => setView('reports')}>Reportes</button>
                    <button onClick={logout}>Cerrar Sesión</button>
                </nav>
                <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-8">
                    <h1 className="text-xl font-bold text-slate-800">
                        {view === 'home' && 'Resumen General'}
                        {view === 'attendance' && 'Registro de Asistencia'}
                        {view === 'reports' && 'Reportes Académicos'}
                    </h1>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-slate-500">Grupo Actual:</span>
                        <select
                            aria-label="Grupo actual"
                            disabled={saving}
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

                <div className="p-4 sm:p-8">
                    {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
                    {notice && <p role="status" className="mb-4 rounded bg-green-50 p-3 text-green-800">{notice}</p>}
                    {(loadingGroups || loadingData) && <p role="status" className="mb-4 text-slate-500">Cargando datos...</p>}
                    {!loadingGroups && !selectedGroup && !error && <p className="text-slate-500">Aún no tienes grupos asignados. Solicita la asignación a la administración.</p>}
                    {view === 'reports' && !!dateRange.start !== !!dateRange.end && <p className="mb-4 text-slate-600">Selecciona ambas fechas para filtrar el reporte.</p>}
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


                    {/* VISTA: ASISTENCIA */}
                    {view === 'attendance' && selectedGroup && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-5 h-5 text-slate-500" />
                                    <input
                                        type="date"
                                        aria-label="Fecha de asistencia"
                                        disabled={saving}
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                        className="border bg-white rounded p-1 font-semibold text-slate-700 focus:ring-0 cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-slate-500">{students.length} Alumnos</span>
                                    <button
                                        onClick={handleSaveAttendance}
                                        disabled={saving || loadingData || !students.length || !!error}
                                        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:bg-blue-300">
                                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {!loadingData && students.length === 0 && <p className="p-6 text-slate-500">Este grupo aún no tiene alumnos.</p>}
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
                                            <label className="text-xs text-slate-500 block" htmlFor="field-14">Desde</label>
                                            <input id="field-14" type="date" className="border rounded px-2 py-1 text-sm text-gray-700"
                                                value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block" htmlFor="field-15">Hasta</label>
                                            <input id="field-15" type="date" className="border rounded px-2 py-1 text-sm text-gray-700"
                                                value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                                        </div>
                                        <div className="flex gap-2 ml-2">
                                            <button onClick={exportPDF} disabled={loadingData || !reportData.length || !!error} className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                                                <FileDown size={14} /> PDF
                                            </button>
                                            <button onClick={exportExcel} disabled={loadingData || !reportData.length || !!error} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
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

export default DocenteDashboard;
