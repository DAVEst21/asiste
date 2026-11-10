import React, { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Trash2, Edit2, BookOpen, GraduationCap, Search } from 'lucide-react';
import AppShell, { initials } from '../components/AppShell';
import Dialog from '../components/Dialog';
import { AdminRepository } from '../api/repository';

const AdminDashboard = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [section, setSection] = useState('docentes'); // docentes, alumnos, grupos
    const [data, setData] = useState([]);
    const [auxData, setAuxData] = useState({ groups: [], teachers: [] }); // Update for Dropdowns

    // CRUD State
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});

    const loadSequence = useRef(0);

    // Cargar datos
    useEffect(() => {
        loadData();
        return () => {
            loadSequence.current++;
        };
    }, [section]);

    const loadData = async () => {
        const sequence = ++loadSequence.current;
        setLoading(true);
        setError('');
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
                if (sequence === loadSequence.current)
                    setAuxData((prev) => ({ ...prev, groups: g }));
            }
            if (section === 'grupos') {
                res = await AdminRepository.getGrupos();
                // Cargar docentes para el dropdown
                const t = await AdminRepository.getDocentes();
                if (sequence === loadSequence.current)
                    setAuxData((prev) => ({ ...prev, teachers: t }));
            }
            if (sequence === loadSequence.current) setData(res);
        } catch (e) {
            if (sequence === loadSequence.current) setError('Error cargando datos: ' + e.message);
        } finally {
            if (sequence === loadSequence.current) setLoading(false);
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
        } catch (e) {
            setError(e.message);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (isEditing) {
                if (section === 'docentes')
                    await AdminRepository.updateDocente(currentItem._id, formData);
                if (section === 'alumnos')
                    await AdminRepository.updateAlumno(currentItem._id, formData);
                if (section === 'grupos')
                    await AdminRepository.updateGrupo(currentItem._id, formData);
            } else {
                if (section === 'docentes') await AdminRepository.createDocente(formData);
                if (section === 'alumnos') await AdminRepository.createAlumno(formData);
                if (section === 'grupos') await AdminRepository.createGrupo(formData);
            }
            setShowForm(false);
            await loadData();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const openForm = (item = null) => {
        setError('');
        setIsEditing(!!item);
        if (item) {
            setCurrentItem(item);
            // Copiar datos relevantes
            const data = { ...item };
            if (data.docente_id && typeof data.docente_id === 'object')
                data.docente_id = data.docente_id._id;
            if (data.grupo_id && typeof data.grupo_id === 'object')
                data.grupo_id = data.grupo_id._id;
            // Limpiar password
            data.password = '';
            setFormData(data);
        } else {
            setFormData({});
            setCurrentItem(null);
        }
        setShowForm(true);
    };

    const names = { docentes: 'docente', alumnos: 'alumno', grupos: 'grupo' };
    const details = {
        docentes: 'Administra las cuentas de docentes.',
        alumnos: 'Administra alumnos y asigna sus grupos.',
        grupos: 'Administra grupos, materias y docentes asignados.',
    };
    const visibleData = data.filter((item) =>
        [item.nombre, item.email, item.matricula, item.materia, item.grupo_id?.nombre]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase('es')
            .includes(search.toLocaleLowerCase('es')),
    );
    const closeForm = () => {
        setShowForm(false);
        setError('');
    };
    return (
        <AppShell
            title={section.charAt(0).toUpperCase() + section.slice(1)}
            description={details[section]}
            active={section}
            busy={saving}
            onNavigate={(id) => {
                setSection(id);
                setSearch('');
            }}
            navigation={[
                { id: 'docentes', label: 'Docentes', icon: GraduationCap },
                { id: 'alumnos', label: 'Alumnos', icon: Users },
                { id: 'grupos', label: 'Grupos', icon: BookOpen },
            ]}
            actions={
                <button
                    className="button button-primary"
                    onClick={() => openForm()}
                    disabled={loading || saving}
                >
                    <UserPlus size={17} />
                    Nuevo
                </button>
            }
        >
            {error && !showForm && (
                <p role="alert" className="message message-error">
                    {error}
                </p>
            )}
            {loading && (
                <p role="status" className="loading-line">
                    Cargando registros...
                </p>
            )}
            <section className="panel">
                <div className="panel-heading">
                    <div>
                        <h2>Directorio de {section}</h2>
                        <p>
                            {data.length} {data.length === 1 ? 'registro' : 'registros'} en esta
                            sección
                        </p>
                    </div>
                    <div className="search-field">
                        <Search size={16} />
                        <input
                            type="search"
                            aria-label={`Buscar ${section}`}
                            placeholder={`Buscar ${section}...`}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>
                <div className="table-scroll">
                    <table className="data-table">
                        <caption className="sr-only">Directorio de {section}</caption>
                        <thead>
                            <tr>
                                <th scope="col">{section === 'grupos' ? 'Grupo' : 'Nombre'}</th>
                                <th scope="col">
                                    {section === 'docentes'
                                        ? 'Email'
                                        : section === 'alumnos'
                                          ? 'Matrícula'
                                          : 'Materia'}
                                </th>
                                {section !== 'docentes' && (
                                    <th scope="col">
                                        {section === 'alumnos' ? 'Grupo' : 'Docente asignado'}
                                    </th>
                                )}
                                <th scope="col" className="table-actions">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleData.map((item) => (
                                <tr key={item._id}>
                                    <td>
                                        <div className="person-cell">
                                            <span className="avatar">{initials(item.nombre)}</span>
                                            <div>
                                                <strong>{item.nombre}</strong>
                                                {section === 'docentes' && <span>Docente</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {section === 'docentes'
                                            ? item.email
                                            : section === 'alumnos'
                                              ? item.matricula
                                              : item.materia}
                                    </td>
                                    {section !== 'docentes' && (
                                        <td>
                                            {section === 'alumnos' ? (
                                                <span className="badge badge-blue">
                                                    {item.grupo_id?.nombre || 'Sin grupo'}
                                                </span>
                                            ) : (
                                                item.docente_id?.nombre || 'Sin asignar'
                                            )}
                                        </td>
                                    )}
                                    <td className="table-actions">
                                        <button
                                            className="icon-button"
                                            aria-label={`Editar ${item.nombre}`}
                                            disabled={loading || saving}
                                            onClick={() => openForm(item)}
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                        <button
                                            className="icon-button danger"
                                            aria-label={`Eliminar ${item.nombre}`}
                                            disabled={loading || saving}
                                            onClick={() => handleDelete(item._id)}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && !visibleData.length && (
                    <div className="empty-state">
                        <Search size={28} />
                        <strong>{search ? 'Sin coincidencias' : 'Sin registros'}</strong>
                        <p>
                            {search
                                ? 'Prueba con otro nombre o dato.'
                                : 'Aún no hay registros en esta sección. Usa Nuevo para agregar el primero.'}
                        </p>
                    </div>
                )}
                <div className="panel-footer">
                    {search
                        ? `${visibleData.length} de ${data.length} registros`
                        : 'Las cuentas se crean y administran desde este espacio.'}
                </div>
            </section>
            {showForm && (
                <Dialog
                    title={`${isEditing ? 'Editar' : 'Nuevo'} ${names[section]}`}
                    description={
                        isEditing
                            ? 'Actualiza los datos y guarda los cambios.'
                            : 'Completa los datos para agregar un registro.'
                    }
                    busy={saving}
                    onClose={closeForm}
                >
                    <form className="dialog-form" onSubmit={handleSave}>
                        {error && (
                            <p role="alert" className="message message-error">
                                {error}
                            </p>
                        )}
                        <div className="form-field">
                            <label htmlFor="admin-name">
                                {section === 'grupos' ? 'Nombre del Grupo' : 'Nombre'}
                            </label>
                            <input
                                id="admin-name"
                                type="text"
                                value={formData.nombre || ''}
                                onChange={(event) =>
                                    setFormData({ ...formData, nombre: event.target.value })
                                }
                                required
                                placeholder={section === 'grupos' ? 'Ej. 7A' : 'Nombre completo'}
                            />
                        </div>
                        {section === 'docentes' && (
                            <div className="form-field">
                                <label htmlFor="admin-email">Email</label>
                                <input
                                    id="admin-email"
                                    type="email"
                                    autoComplete="off"
                                    value={formData.email || ''}
                                    onChange={(event) =>
                                        setFormData({ ...formData, email: event.target.value })
                                    }
                                    required
                                    placeholder="nombre@ejemplo.com"
                                />
                            </div>
                        )}
                        {section === 'alumnos' && (
                            <>
                                <div className="form-field">
                                    <label htmlFor="admin-enrollment">Matrícula</label>
                                    <input
                                        id="admin-enrollment"
                                        type="text"
                                        value={formData.matricula || ''}
                                        onChange={(event) =>
                                            setFormData({
                                                ...formData,
                                                matricula: event.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="admin-group">Grupo</label>
                                    <select
                                        id="admin-group"
                                        value={formData.grupo_id || ''}
                                        onChange={(event) =>
                                            setFormData({
                                                ...formData,
                                                grupo_id: event.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="">Selecciona un Grupo...</option>
                                        {auxData.groups.map((group) => (
                                            <option key={group._id} value={group._id}>
                                                {group.nombre} ({group.materia})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        {section === 'grupos' && (
                            <>
                                <div className="form-field">
                                    <label htmlFor="admin-subject">Materia</label>
                                    <input
                                        id="admin-subject"
                                        type="text"
                                        value={formData.materia || ''}
                                        onChange={(event) =>
                                            setFormData({
                                                ...formData,
                                                materia: event.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="admin-teacher">Docente Asignado</label>
                                    <select
                                        id="admin-teacher"
                                        value={formData.docente_id || ''}
                                        onChange={(event) =>
                                            setFormData({
                                                ...formData,
                                                docente_id: event.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="">Selecciona un Docente...</option>
                                        {auxData.teachers.map((teacher) => (
                                            <option key={teacher._id} value={teacher._id}>
                                                {teacher.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        {section !== 'grupos' && (
                            <div className="form-field">
                                <label htmlFor="admin-password">
                                    Contraseña {isEditing && '(Dejar vacío para no cambiar)'}
                                </label>
                                <input
                                    id="admin-password"
                                    type="password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    value={formData.password || ''}
                                    onChange={(event) =>
                                        setFormData({ ...formData, password: event.target.value })
                                    }
                                    required={!isEditing}
                                />
                                <span className="field-hint">Al menos 8 caracteres.</span>
                            </div>
                        )}
                        <div className="dialog-actions">
                            <button
                                className="button button-secondary"
                                type="button"
                                disabled={saving}
                                onClick={closeForm}
                            >
                                Cancelar
                            </button>
                            <button
                                className="button button-primary"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </Dialog>
            )}
        </AppShell>
    );
};

export default AdminDashboard;
