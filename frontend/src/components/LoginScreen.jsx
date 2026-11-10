import React, { useContext, useState } from 'react';
import {
    ArrowRight,
    BookOpenCheck,
    CalendarCheck2,
    Eye,
    EyeOff,
    LockKeyhole,
    Users,
} from 'lucide-react';
import { AuthContext } from '../auth/AuthContext';
import { AuthRepository } from '../api/repository';
import { Brand } from './AppShell';

export default function LoginScreen() {
    const { login } = useContext(AuthContext);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            login(await AuthRepository.login(identifier, password));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="login-page">
            <section className="login-story" aria-label="Acerca de Asiste">
                <Brand light />
                <div className="login-story-content">
                    <span className="story-tag">
                        <span />
                        Gestión académica
                    </span>
                    <h1>
                        Control de
                        <br />
                        asistencia
                    </h1>
                    <p>Registro por fecha, historial de asistencia y reportes por grupo.</p>
                    <div className="story-features">
                        <div>
                            <CalendarCheck2 size={20} />
                            <span>Captura y corrección de asistencias</span>
                        </div>
                        <div>
                            <Users size={20} />
                            <span>Accesos de administración, docentes y alumnos</span>
                        </div>
                        <div>
                            <BookOpenCheck size={20} />
                            <span>Reportes en PDF y Excel</span>
                        </div>
                    </div>
                </div>
            </section>
            <main className="login-main">
                <div className="login-mobile-brand">
                    <Brand />
                </div>
                <div className="login-form-container">
                    <span className="login-lock">
                        <LockKeyhole size={24} strokeWidth={1.7} />
                    </span>
                    <h2>Acceso a Asiste</h2>
                    <p className="login-description">Ingresa a tu cuenta para continuar.</p>
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-field">
                            <label htmlFor="login-identifier">Email o Matrícula</label>
                            <input
                                id="login-identifier"
                                type="text"
                                autoComplete="username"
                                required
                                value={identifier}
                                onChange={(event) => setIdentifier(event.target.value)}
                                placeholder="Tu email o matrícula"
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="login-password">Contraseña</label>
                            <div className="password-field">
                                <input
                                    id="login-password"
                                    type={visible ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Ingresa tu contraseña"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    aria-label={
                                        visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                                    }
                                    aria-pressed={visible}
                                    onClick={() => setVisible((value) => !value)}
                                >
                                    {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                                </button>
                            </div>
                        </div>
                        {error && (
                            <p role="alert" className="message message-error">
                                {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            className="button button-primary login-submit"
                            disabled={loading}
                        >
                            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
                            <ArrowRight size={17} aria-hidden="true" />
                        </button>
                    </form>
                    <p className="login-account-note">
                        ¿Aún no tienes acceso?
                        <br />
                        <span>Solicita tu cuenta a la administración.</span>
                    </p>
                </div>
                <footer className="login-footer">Asiste · Proyecto académico personal</footer>
            </main>
        </div>
    );
}
