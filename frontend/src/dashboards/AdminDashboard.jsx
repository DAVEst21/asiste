import React, { useState, useEffect, useContext, useRef } from 'react';
import { LogOut, UserPlus, Trash2, Edit2 } from 'lucide-react';
import { AuthContext } from '../auth/AuthContext';
import { AdminRepository } from '../api/repository';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
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
        return () => { loadSequence.current++; };
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
                if (sequence === loadSequence.current) setAuxData(prev => ({ ...prev, groups: g }));
            }
            if (section === 'grupos') {
                res = await AdminRepository.getGrupos();
                // Cargar docentes para el dropdown
                const t = await AdminRepository.getDocentes();
                if (sequence === loadSequence.current) setAuxData(prev => ({ ...prev, teachers: t }));
            }
            if (sequence === loadSequence.current) setData(res);
        } catch (e) {
            if (sequence === loadSequence.current) setError('Error cargando datos: ' + e.message);
        } finally { if (sequence === loadSequence.current) setLoading(false); }
    };

    // Actions
    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
        try {
            if (section === 'docentes') await AdminRepository.deleteDocente(id);
            if (section === 'alumnos') await AdminRepository.deleteAlumno(id);
            if (section === 'grupos') await AdminRepository.deleteGrupo(id);
            loadData();
        } catch (e) { setError(e.message); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
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
            await loadData();
        } catch (e) { setError(e.message); } finally { setSaving(false); }
    };

    const openForm = (item = null) => {
        setError('');
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
            <aside className="w-36 sm:w-64 shrink-0 bg-slate-900 text-white flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-700">
                    <span className="font-bold text-lg">Asiste · Admin</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button disabled={saving} onClick={() => setSection('docentes')} className={`w-full text-left px-4 py-2 rounded ${section === 'docentes' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Docentes</button>
                    <button disabled={saving} onClick={() => setSection('alumnos')} className={`w-full text-left px-4 py-2 rounded ${section === 'alumnos' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Alumnos</button>
                    <button disabled={saving} onClick={() => setSection('grupos')} className={`w-full text-left px-4 py-2 rounded ${section === 'grupos' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Grupos</button>
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <button onClick={logout} className="flex items-center text-red-400 hover:text-red-300">
                        <LogOut className="w-4 h-4 mr-2" /> Salir
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0 p-4 sm:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold capitalize text-slate-800">{section}</h1>
                    <button onClick={() => openForm()} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center">
                        <UserPlus className="w-4 h-4 mr-2" /> Nuevo
                    </button>
                </div>

                {error && !showForm && <p role="alert" className="mb-4 text-red-700">{error}</p>}
                {loading && <p role="status" className="mb-4">Cargando registros...</p>}
                {!loading && data.length === 0 && <p className="mb-4 text-slate-500">Aún no hay registros en esta sección.</p>}
                <div className="bg-white rounded-lg shadow overflow-x-auto">
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
                                        <button aria-label={`Editar ${item.nombre}`} onClick={() => openForm(item)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                                        <button aria-label={`Eliminar ${item.nombre}`} onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
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
                            {error && <p role="alert" className="text-red-700">{error}</p>}
                            {section !== 'grupos' && (
                                <div>
                                    <label className="block text-sm font-medium" htmlFor="field-6">Nombre</label>
                                    <input id="field-6" type="text" className="w-full border rounded p-2" value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
                                </div>
                            )}

                            {/* Campos Docente */}
                            {section === 'docentes' && (
                                <div>
                                    <label className="block text-sm font-medium" htmlFor="field-7">Email</label>
                                    <input id="field-7" type="email" className="w-full border rounded p-2" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                            )}

                            {/* Campos Alumno */}
                            {section === 'alumnos' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium" htmlFor="field-8">Matrícula</label>
                                        <input id="field-8" type="text" className="w-full border rounded p-2" value={formData.matricula || ''} onChange={e => setFormData({ ...formData, matricula: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium" htmlFor="field-9">Grupo</label>
                                        <select id="field-9"
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
                                        <label className="block text-sm font-medium" htmlFor="field-10">Nombre del Grupo</label>
                                        <input id="field-10" type="text" className="w-full border rounded p-2" value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required placeholder="Ej. 3A" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium" htmlFor="field-11">Materia</label>
                                        <input id="field-11" type="text" className="w-full border rounded p-2" value={formData.materia || ''} onChange={e => setFormData({ ...formData, materia: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium" htmlFor="field-12">Docente Asignado</label>
                                        <select id="field-12"
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
                                    <label className="block text-sm font-medium" htmlFor="field-13">Contraseña {isEditing && '(Dejar vacío para no cambiar)'}</label>
                                    <input id="field-13" type="password" minLength={8} className="w-full border rounded p-2" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!isEditing} />
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" disabled={saving} onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
