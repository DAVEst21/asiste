import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

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
                            aria-label={`${config.label}: ${alumno.nombre}`}
                            aria-pressed={isActive}
                        >
                            <Icon className="w-5 h-5" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default AttendanceRow;
