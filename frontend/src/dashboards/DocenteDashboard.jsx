import React, { useState, useEffect, useContext } from 'react';
import {
    BookOpen,
    Users,
    CheckCircle,
    Calendar,
    BarChart3,
    FileDown,
    ClipboardCheck,
    ArrowRight,
    Info,
    Save,
    Search,
} from 'lucide-react';
import AppShell, { initials } from '../components/AppShell';
import { AuthContext } from '../auth/AuthContext';
import {
    GroupRepository,
    StudentRepository,
    AttendanceRepository,
    StatsRepository,
} from '../api/repository';
import StatCard from '../components/StatCard';
import AttendanceRow from '../components/AttendanceRow';

const DocenteDashboard = () => {
    const { user } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [view, setView] = useState('home');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groups, setGroups] = useState([]);

    // Estados Home (Stats)
    const [stats, setStats] = useState({
        totalAlumnos: 0,
        clasesImpartidas: 0,
        promedioAsistencia: 0,
    });

    // Estados Asistencia
    const [students, setStudents] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    );
    const [attendanceData, setAttendanceData] = useState({});
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    // Estados Reportes
    const [reportData, setReportData] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        let active = true;
        GroupRepository.getByDocente()
            .then((rows) => {
                if (active) {
                    setGroups(rows);
                    setSelectedGroup(rows[0] || null);
                }
            })
            .catch((e) => {
                if (active) setError(e.message);
            })
            .finally(() => {
                if (active) setLoadingGroups(false);
            });
        return () => {
            active = false;
        };
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
                        AttendanceRepository.getByGroupAndDate(selectedGroup._id, attendanceDate),
                    ]);
                    if (active) {
                        setStudents(rows);
                        const values = Object.fromEntries(rows.map((row) => [row._id, 'presente']));
                        records.forEach((record) => {
                            values[record.alumno_id?._id || record.alumno_id] = record.estado;
                        });
                        setAttendanceData(values);
                    }
                } else {
                    if (!!dateRange.start !== !!dateRange.end) {
                        if (active) setReportData([]);
                        return;
                    }
                    const rows = await AttendanceRepository.getReport(
                        selectedGroup._id,
                        dateRange.start,
                        dateRange.end,
                    );
                    if (active) setReportData(rows);
                }
            } catch (e) {
                if (active) setError(e.message);
            } finally {
                if (active) setLoadingData(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [view, selectedGroup, attendanceDate, dateRange]);

    const handleStatusChange = (studentId, newStatus) => {
        setAttendanceData((prev) => ({ ...prev, [studentId]: newStatus }));
    };

    const handleSaveAttendance = async () => {
        if (loadingData || !students.length) return;
        setSaving(true);
        setError('');
        try {
            const asistencias = Object.keys(attendanceData).map((studentId) => ({
                alumno_id: studentId,
                estado: attendanceData[studentId],
            }));

            await AttendanceRepository.saveOrUpdateBatch(
                selectedGroup._id,
                attendanceDate,
                asistencias,
            );
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
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable'),
            ]);
            const doc = new jsPDF();
            doc.text(`Reporte de Asistencias - ${selectedGroup.nombre}`, 14, 15);
            doc.text(`Materia: ${selectedGroup.materia}`, 14, 22);

            const tableColumn = ['Alumno', 'Matrícula', 'Clases', 'Faltas', 'Retardos', '% Asist'];
            const tableRows = [];

            reportData.forEach((row) => {
                const rowData = [
                    row.alumno.nombre,
                    row.alumno.matricula,
                    row.total_clases,
                    row.faltas,
                    row.retardos,
                    row.porcentaje_asistencia + '%',
                ];
                tableRows.push(rowData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 30,
            });

            doc.save('reporte_asistencia.pdf');
        } catch (e) {
            setError(`No fue posible exportar el PDF: ${e.message}`);
        }
    };

    const exportExcel = async () => {
        try {
            const XLSX = await import('xlsx');
            const worksheet = XLSX.utils.json_to_sheet(
                reportData.map((row) => ({
                    Alumno: row.alumno.nombre,
                    Matrícula: row.alumno.matricula,
                    'Total Clases': row.total_clases,
                    Faltas: row.faltas,
                    Retardos: row.retardos,
                    '% Asistencia': row.porcentaje_asistencia,
                })),
            );
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
            XLSX.writeFile(workbook, 'reporte_asistencia.xlsx');
        } catch (e) {
            setError(`No fue posible exportar Excel: ${e.message}`);
        }
    };

    const labels = {
        home: [
            'Resumen del grupo',
            'Alumnos inscritos, clases registradas y porcentaje de asistencia.',
        ],
        attendance: [
            'Registro de Asistencia',
            'Registra o corrige la asistencia de una fecha.',
        ],
        reports: [
            'Reportes de asistencia',
            'Consulta registros por fecha y exporta reportes.',
        ],
    };
    const visibleStudents = students.filter((student) =>
        `${student.nombre} ${student.matricula}`
            .toLocaleLowerCase('es')
            .includes(search.toLocaleLowerCase('es')),
    );
    const counts = Object.values(attendanceData).reduce(
        (result, status) => ({ ...result, [status]: (result[status] || 0) + 1 }),
        {},
    );
    return (
        <AppShell
            title={labels[view][0]}
            description={labels[view][1]}
            active={view}
            onNavigate={setView}
            busy={saving}
            navigation={[
                { id: 'home', label: 'Mis Grupos', icon: BookOpen },
                { id: 'attendance', label: 'Pasar Lista', icon: ClipboardCheck },
                { id: 'reports', label: 'Reportes', icon: BarChart3 },
            ]}
            actions={
                groups.length > 0 && (
                    <div className="group-picker">
                        <label htmlFor="current-group">Grupo actual</label>
                        <select
                            id="current-group"
                            aria-label="Grupo actual"
                            disabled={saving}
                            value={selectedGroup?._id || ''}
                            onChange={(event) => {
                                setSelectedGroup(
                                    groups.find((group) => group._id === event.target.value),
                                );
                                setSearch('');
                            }}
                        >
                            {groups.map((group) => (
                                <option key={group._id} value={group._id}>
                                    {group.nombre} · {group.materia}
                                </option>
                            ))}
                        </select>
                    </div>
                )
            }
        >
            {error && (
                <p role="alert" className="message message-error">
                    {error}
                </p>
            )}
            {notice && (
                <p role="status" className="message message-success">
                    <CheckCircle size={17} />
                    {notice}
                </p>
            )}
            {(loadingGroups || loadingData) && (
                <p role="status" className="loading-line">
                    Cargando datos...
                </p>
            )}
            {!loadingGroups && !selectedGroup && !error && (
                <div className="panel empty-state">
                    <BookOpen size={31} />
                    <strong>Sin grupos asignados</strong>
                    <p>
                        Aún no tienes grupos asignados. Solicita la asignación a la administración.
                    </p>
                </div>
            )}
            {view === 'home' && selectedGroup && (
                <>
                    <section className="course-banner">
                        <span className="course-icon">
                            <BookOpen size={26} strokeWidth={1.6} />
                        </span>
                        <div>
                            <p className="eyebrow">Grupo seleccionado</p>
                            <h2>{selectedGroup.materia}</h2>
                            <p>
                                {selectedGroup.nombre} · {user.nombre}
                            </p>
                        </div>
                        <span className="course-badge">
                            Semestre {selectedGroup.semestre || 'sin asignar'}
                        </span>
                    </section>
                    <div className="stat-grid">
                        <StatCard
                            title="Total Alumnos"
                            value={stats.totalAlumnos}
                            icon={Users}
                            detail="Alumnos inscritos en este grupo"
                        />
                        <StatCard
                            title="Clases Impartidas"
                            value={stats.clasesImpartidas}
                            icon={Calendar}
                            tone="green"
                            detail="Fechas con asistencia registrada"
                        />
                        <StatCard
                            title="Promedio Asistencia"
                            value={`${stats.promedioAsistencia}%`}
                            icon={CheckCircle}
                            tone="amber"
                            detail="Sobre los registros capturados"
                        />
                    </div>
                    <div className="quick-grid">
                        <button
                            className="panel quick-action"
                            onClick={() => setView('attendance')}
                        >
                            <div>
                                <strong>Pasar Lista Hoy</strong>
                                <p>
                                    Registra presentes, retardos y faltas
                                    <br />o revisa una fecha anterior.
                                </p>
                            </div>
                            <span>
                                <ArrowRight size={18} />
                            </span>
                        </button>
                        <button className="panel quick-action" onClick={() => setView('reports')}>
                            <div>
                                <strong>Ver Reportes</strong>
                                <p>
                                    Consulta el historial del grupo
                                    <br />y descarga un reporte.
                                </p>
                            </div>
                            <span>
                                <ArrowRight size={18} />
                            </span>
                        </button>
                    </div>
                    <div className="note-panel section-gap">
                        <Info size={18} />
                        <div>
                            <strong>Corrección de asistencias</strong>
                            <p>
                                Si necesitas ajustar una asistencia, selecciona la misma fecha y
                                vuelve a guardar. Se actualizará el registro existente.
                            </p>
                        </div>
                    </div>
                </>
            )}
            {view === 'attendance' && selectedGroup && (
                <>
                    <section className="panel">
                        <div className="panel-heading">
                            <div className="panel-heading-icon">
                                <ClipboardCheck size={19} />
                                <div>
                                    <h2>{selectedGroup.materia}</h2>
                                    <p>
                                        Grupo {selectedGroup.nombre} · {students.length} alumnos
                                    </p>
                                </div>
                            </div>
                            <span className="badge badge-blue">Captura por día</span>
                        </div>
                        <div className="attendance-toolbar">
                            <div className="attendance-date">
                                <label className="field-label" htmlFor="attendance-date">
                                    Fecha de asistencia
                                </label>
                                <input
                                    id="attendance-date"
                                    type="date"
                                    disabled={saving}
                                    value={attendanceDate}
                                    onChange={(event) => setAttendanceDate(event.target.value)}
                                />
                            </div>
                            <button
                                className="button button-primary"
                                onClick={handleSaveAttendance}
                                disabled={saving || loadingData || !students.length || !!error}
                            >
                                <Save size={16} />
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                        <div className="panel-heading">
                            <span className="field-hint">
                                Selecciona el estado de cada alumno antes de guardar.
                            </span>
                            <div className="search-field">
                                <Search size={16} />
                                <input
                                    type="search"
                                    aria-label="Buscar alumno"
                                    placeholder="Buscar por nombre o matrícula"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </div>
                        </div>
                        {!loadingData && students.length === 0 && (
                            <div className="empty-state">
                                <Users size={28} />
                                <p>Este grupo aún no tiene alumnos.</p>
                            </div>
                        )}
                        {visibleStudents.map((student) => (
                            <AttendanceRow
                                key={student._id}
                                alumno={student}
                                status={attendanceData[student._id]}
                                onUpdate={handleStatusChange}
                                disabled={saving || loadingData}
                            />
                        ))}
                        {students.length > 0 && !visibleStudents.length && (
                            <div className="empty-state">
                                <Search size={25} />
                                <p>No hay alumnos que coincidan con tu búsqueda.</p>
                            </div>
                        )}
                        <div className="panel-footer">
                            Los cambios se registran al pulsar Guardar Cambios.
                        </div>
                    </section>
                    <div className="attendance-summary">
                        <span>Resumen de la captura</span>
                        {[
                            ['presente', 'presentes'],
                            ['retardo', 'retardos'],
                            ['falta', 'faltas'],
                        ].map(([status, label]) => (
                            <span key={status} className="summary-item">
                                <span className={`status-dot ${status}`} />
                                {counts[status] || 0} {label}
                            </span>
                        ))}
                    </div>
                </>
            )}
            {view === 'reports' && selectedGroup && (
                <>
                    {!!dateRange.start !== !!dateRange.end && (
                        <p className="message message-info">
                            Selecciona ambas fechas para filtrar el reporte.
                        </p>
                    )}
                    <section className="panel">
                        <div className="panel-heading">
                            <div className="panel-heading-icon">
                                <BarChart3 size={19} />
                                <div>
                                    <h2>Reporte de asistencia</h2>
                                    <p>
                                        {selectedGroup.materia} · {selectedGroup.nombre}
                                    </p>
                                </div>
                            </div>
                            <span className="badge badge-blue">
                                {reportData.length} alumnos con registros
                            </span>
                        </div>
                        <div className="report-filters">
                            <div className="form-field">
                                <label htmlFor="report-from">Desde</label>
                                <input
                                    id="report-from"
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(event) =>
                                        setDateRange({ ...dateRange, start: event.target.value })
                                    }
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="report-to">Hasta</label>
                                <input
                                    id="report-to"
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(event) =>
                                        setDateRange({ ...dateRange, end: event.target.value })
                                    }
                                />
                            </div>
                            <div className="export-actions">
                                <button
                                    className="button button-secondary"
                                    disabled={loadingData || !reportData.length || !!error}
                                    onClick={exportPDF}
                                >
                                    <FileDown size={16} />
                                    PDF
                                </button>
                                <button
                                    className="button button-secondary"
                                    disabled={loadingData || !reportData.length || !!error}
                                    onClick={exportExcel}
                                >
                                    <FileDown size={16} />
                                    Excel
                                </button>
                            </div>
                        </div>
                        <div className="table-scroll">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Alumno</th>
                                        <th scope="col" className="numeric">
                                            Clases
                                        </th>
                                        <th scope="col" className="numeric">
                                            Faltas
                                        </th>
                                        <th scope="col" className="numeric">
                                            Retardos
                                        </th>
                                        <th scope="col" className="numeric">
                                            Asistencia
                                        </th>
                                        <th scope="col">Seguimiento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row) => (
                                        <tr key={row.alumno._id}>
                                            <td>
                                                <div className="person-cell">
                                                    <span className="avatar">
                                                        {initials(row.alumno.nombre)}
                                                    </span>
                                                    <div>
                                                        <strong>{row.alumno.nombre}</strong>
                                                        <span>{row.alumno.matricula}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="numeric">{row.total_clases}</td>
                                            <td className="numeric">{row.faltas}</td>
                                            <td className="numeric">{row.retardos}</td>
                                            <td className="numeric">
                                                <div className="percentage">
                                                    <strong>{row.porcentaje_asistencia}%</strong>
                                                    <span className="percentage-track">
                                                        <span
                                                            style={{
                                                                width: `${row.porcentaje_asistencia}%`,
                                                            }}
                                                        />
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${row.porcentaje_asistencia < 80 ? 'badge-amber' : 'badge-green'}`}
                                                >
                                                    {row.porcentaje_asistencia < 80
                                                        ? 'Por revisar'
                                                        : 'Regular'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!reportData.length && !loadingData && (
                            <div className="empty-state">
                                <BarChart3 size={28} />
                                <strong>Aún no hay datos para mostrar</strong>
                                <p>Registra una clase o selecciona otro intervalo de fechas.</p>
                            </div>
                        )}
                        <div className="panel-footer">
                            Presentes y retardos cuentan como asistencia. El indicador de
                            seguimiento usa una referencia visual de 80%.
                        </div>
                    </section>
                </>
            )}
        </AppShell>
    );
};

export default DocenteDashboard;
