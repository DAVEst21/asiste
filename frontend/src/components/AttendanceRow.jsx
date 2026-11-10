import React from 'react';
import { Check, X, Clock3 } from 'lucide-react';
import { initials } from './AppShell';

const statuses = [
    { value: 'presente', label: 'Presente', icon: Check },
    { value: 'retardo', label: 'Retardo', icon: Clock3 },
    { value: 'falta', label: 'Falta', icon: X },
];
export default function AttendanceRow({ alumno, status, onUpdate, disabled = false }) {
    return (
        <div className="attendance-row">
            <div className="person-cell">
                <span className="avatar">{initials(alumno.nombre)}</span>
                <div>
                    <strong>{alumno.nombre}</strong>
                    <span>{alumno.matricula}</span>
                </div>
            </div>
            <div
                className="attendance-options"
                role="group"
                aria-label={`Asistencia de ${alumno.nombre}`}
            >
                {statuses.map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        type="button"
                        disabled={disabled}
                        className={`attendance-option attendance-${value} ${status === value ? 'is-selected' : ''}`}
                        aria-label={`${label}: ${alumno.nombre}`}
                        aria-pressed={status === value}
                        onClick={() => onUpdate(alumno._id, value)}
                    >
                        <Icon size={16} aria-hidden="true" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
