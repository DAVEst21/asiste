import React, { useContext, useEffect, useState } from 'react';
import {
    Calendar,
    CheckCircle,
    Clock,
    ClipboardCheck,
    Info,
    KeyRound,
    XCircle,
} from 'lucide-react';
import { AuthContext } from '../auth/AuthContext';
import { StudentRepository, AttendanceRepository } from '../api/repository';
import AppShell from '../components/AppShell';
import Dialog from '../components/Dialog';
import StatCard from '../components/StatCard';

export default function StudentDashboard() {
    const { user } = useContext(AuthContext);
    const [view, setView] = useState('summary');
    const [report, setReport] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const [rows, records] = await Promise.all([
                    AttendanceRepository.getReport(user.grupo_id),
                    StudentRepository.getMyHistory(),
                ]);
                if (active) {
                    setReport(rows[0] || null);
                    setHistory(records);
                }
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [user.grupo_id]);

    const closePassword = () => {
        setShowPasswordModal(false);
        setPasswordError('');
        setPassData({ current: '', new: '', confirm: '' });
    };
    const handleChangePassword = async (event) => {
        event.preventDefault();
        if (passData.new !== passData.confirm) {
            setPasswordError('Las contraseñas no coinciden.');
            return;
        }
        setPasswordSaving(true);
        setPasswordError('');
        try {
            await StudentRepository.changePassword(passData.current, passData.new);
            closePassword();
            setNotice('Contraseña actualizada correctamente.');
        } catch (err) {
            setPasswordError(err.message);
        } finally {
            setPasswordSaving(false);
        }
    };
    const percentage = Math.min(100, Math.max(0, report?.porcentaje_asistencia || 0));
    return (
        <AppShell
            title={view === 'summary' ? 'Mi Asistencia' : 'Historial de asistencia'}
            description={`${user.nombre} · Matrícula ${user.matricula}`}
            active={view}
            onNavigate={setView}
            busy={passwordSaving}
            navigation={[
                { id: 'summary', label: 'Mi Asistencia', icon: Calendar },
                { id: 'history', label: 'Historial', icon: ClipboardCheck },
            ]}
            actions={
                <button
                    className="button button-secondary"
                    onClick={() => {
                        setPasswordError('');
                        setShowPasswordModal(true);
                    }}
                >
                    <KeyRound size={16} />
                    Contraseña
                </button>
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
            {loading && (
                <p role="status" className="loading-line">
                    Cargando información...
                </p>
            )}
            {report && view === 'summary' && (
                <section className="student-overview">
                    <div className="panel student-percentage">
                        <p>Tu porcentaje de asistencia</p>
                        <div
                            className="percentage-ring"
                            style={{ '--progress': `${percentage}%` }}
                            role="img"
                            aria-label={`${percentage}% de asistencia`}
                        >
                            <div>
                                <strong>{percentage}%</strong>
                                <span>de asistencia</span>
                            </div>
                        </div>
                        <span>
                            Presentes y retardos
                            <br />
                            sobre clases registradas.
                        </span>
                    </div>
                    <div className="student-overview-right">
                        <div className="student-metrics">
                            <StatCard
                                title="Clases registradas"
                                value={report.total_clases}
                                icon={Calendar}
                                detail="En tu historial"
                            />
                            <StatCard
                                title="Faltas"
                                value={report.faltas}
                                icon={XCircle}
                                tone="red"
                                detail="Inasistencias registradas"
                            />
                            <StatCard
                                title="Retardos"
                                value={report.retardos}
                                icon={Clock}
                                tone="amber"
                                detail="Cuentan como asistencia"
                            />
                        </div>
                        <div className="note-panel">
                            <Info size={18} />
                            <div>
                                <strong>Correcciones de asistencia</strong>
                                <p>
                                    Revisa el detalle de cada clase en tu historial. Si encuentras
                                    un registro que necesita corregirse, comunícalo a tu docente.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
            {!loading && !error && !report && (
                <div className="panel empty-state">
                    <Calendar size={30} />
                    <strong>Sin asistencias registradas</strong>
                    <p>
                        Aún no hay asistencias registradas. Tu docente podrá registrar la primera
                        clase.
                    </p>
                </div>
            )}
            {report && (
                <section className="panel">
                    <div className="panel-heading">
                        <div className="panel-heading-icon">
                            <ClipboardCheck size={19} />
                            <div>
                                <h2>Historial detallado</h2>
                                <p>Registros ordenados del más reciente al más antiguo.</p>
                            </div>
                        </div>
                        <span className="badge badge-blue">{history.length} registros</span>
                    </div>
                    <div className="table-scroll">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th scope="col">Fecha</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Observación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record) => (
                                    <tr key={record._id}>
                                        <td>
                                            {new Intl.DateTimeFormat('es-MX', {
                                                timeZone: 'UTC',
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            }).format(new Date(record.fecha))}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${record.estado === 'presente' ? 'badge-green' : record.estado === 'falta' ? 'badge-red' : 'badge-amber'}`}
                                            >
                                                <span className={`status-dot ${record.estado}`} />
                                                {record.estado === 'presente'
                                                    ? 'Presente'
                                                    : record.estado === 'falta'
                                                      ? 'Falta'
                                                      : 'Retardo'}
                                            </span>
                                        </td>
                                        <td>{record.observaciones || 'Sin observaciones'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="panel-footer">
                        Solo tú y el personal autorizado pueden consultar esta información.
                    </div>
                </section>
            )}
            {showPasswordModal && (
                <Dialog
                    title="Cambiar Contraseña"
                    description="Usa una contraseña que recuerdes y no compartas con otras personas."
                    busy={passwordSaving}
                    onClose={closePassword}
                >
                    <form className="dialog-form" onSubmit={handleChangePassword}>
                        {passwordError && (
                            <p role="alert" className="message message-error">
                                {passwordError}
                            </p>
                        )}
                        <div className="form-field">
                            <label htmlFor="password-current">Contraseña Actual</label>
                            <input
                                id="password-current"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={passData.current}
                                onChange={(event) =>
                                    setPassData({ ...passData, current: event.target.value })
                                }
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="password-new">Nueva Contraseña</label>
                            <input
                                id="password-new"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                value={passData.new}
                                onChange={(event) =>
                                    setPassData({ ...passData, new: event.target.value })
                                }
                            />
                            <span className="field-hint">Al menos 8 caracteres.</span>
                        </div>
                        <div className="form-field">
                            <label htmlFor="password-confirm">Confirmar Nueva</label>
                            <input
                                id="password-confirm"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={passData.confirm}
                                onChange={(event) =>
                                    setPassData({ ...passData, confirm: event.target.value })
                                }
                            />
                        </div>
                        <div className="dialog-actions">
                            <button
                                className="button button-secondary"
                                type="button"
                                disabled={passwordSaving}
                                onClick={closePassword}
                            >
                                Cancelar
                            </button>
                            <button
                                className="button button-primary"
                                type="submit"
                                disabled={passwordSaving}
                            >
                                {passwordSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </Dialog>
            )}
        </AppShell>
    );
}
