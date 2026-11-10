import React, { useContext, useEffect, useRef, useState } from 'react';
import { BookOpenCheck, CalendarDays, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import { AuthContext } from '../auth/AuthContext';

const ROLE_NAMES = {
    admin: 'Administración',
    docente: 'Espacio docente',
    alumno: 'Espacio del alumno',
};
export const initials = (name) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

export function Brand({ light = false }) {
    return (
        <div className={`brand ${light ? 'brand-light' : ''}`}>
            <span className="brand-symbol">
                <BookOpenCheck size={25} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
                <span className="brand-name">
                    Asiste<span className="brand-dot">.</span>
                </span>
                <span className="brand-caption">Asistencia académica</span>
            </div>
        </div>
    );
}

export default function AppShell({
    title,
    description,
    navigation,
    active,
    onNavigate,
    actions,
    children,
    busy = false,
}) {
    const { user, logout } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuButton = useRef(null);
    const sidebar = useRef(null);
    const role = ROLE_NAMES[user.rol];
    const closeMenu = () => {
        setMenuOpen(false);
        menuButton.current?.focus();
    };

    useEffect(() => {
        if (!menuOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        sidebar.current?.querySelector('button')?.focus();
        const keyboard = (event) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
                menuButton.current?.focus();
            }
            if (event.key === 'Tab') {
                const buttons = [...sidebar.current.querySelectorAll('button:not(:disabled)')];
                const first = buttons[0],
                    last = buttons.at(-1);
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', keyboard);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', keyboard);
        };
    }, [menuOpen]);

    return (
        <div className="workspace">
            <a className="skip-link" href="#main-content">
                Saltar al contenido
            </a>
            {menuOpen && (
                <button
                    className="sidebar-backdrop"
                    aria-label="Cerrar navegación"
                    onClick={closeMenu}
                    tabIndex={-1}
                />
            )}
            <aside ref={sidebar} className={`workspace-sidebar ${menuOpen ? 'is-open' : ''}`}>
                <div className="sidebar-brand">
                    <Brand light />
                    <button className="sidebar-close" aria-label="Cerrar menú" onClick={closeMenu}>
                        <X size={20} />
                    </button>
                </div>
                <p className="sidebar-section">{role}</p>
                <nav aria-label="Navegación principal" className="workspace-nav">
                    {navigation.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            disabled={busy}
                            className={`nav-item ${active === id ? 'is-active' : ''}`}
                            aria-current={active === id ? 'page' : undefined}
                            onClick={() => {
                                onNavigate?.(id);
                                setMenuOpen(false);
                            }}
                        >
                            <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                            <span>{label}</span>
                            <ChevronRight className="nav-chevron" size={15} aria-hidden="true" />
                        </button>
                    ))}
                </nav>
                <div className="sidebar-account">
                    <span className="avatar avatar-light">{initials(user.nombre)}</span>
                    <div className="account-copy">
                        <strong>{user.nombre}</strong>
                        <span>
                            {user.rol === 'alumno'
                                ? user.matricula
                                : user.rol === 'admin'
                                  ? 'Administrador'
                                  : 'Docente'}
                        </span>
                    </div>
                </div>
                <button className="sidebar-logout" disabled={busy} onClick={logout}>
                    <LogOut size={17} aria-hidden="true" />
                    {user.rol === 'docente' ? 'Cerrar Sesión' : 'Salir'}
                </button>
            </aside>
            <div className="workspace-main">
                <header className="workspace-topbar">
                    <button
                        ref={menuButton}
                        className="mobile-menu"
                        aria-label="Abrir menú"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen(true)}
                    >
                        <Menu size={23} />
                    </button>
                    <div className="breadcrumb">
                        <span>Asiste</span>
                        <ChevronRight size={14} aria-hidden="true" />
                        <strong>{role}</strong>
                    </div>
                    <div className="topbar-date">
                        <CalendarDays size={16} aria-hidden="true" />
                        <span>
                            {new Intl.DateTimeFormat('es-MX', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            }).format(new Date())}
                        </span>
                    </div>
                    <span className="avatar topbar-avatar">{initials(user.nombre)}</span>
                </header>
                <main id="main-content" className="page-content" tabIndex={-1}>
                    <div className="page-heading">
                        <div>
                            <p className="eyebrow">{role}</p>
                            <h1>{title}</h1>
                            <p className="page-description">{description}</p>
                        </div>
                        {actions && <div className="page-actions">{actions}</div>}
                    </div>
                    {children}
                    <footer className="page-footer">
                        <span>Asiste · Gestión de asistencia académica</span>
                        <span>Proyecto académico personal</span>
                    </footer>
                </main>
            </div>
        </div>
    );
}
