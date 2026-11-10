import React, { useState, useContext } from 'react';
import { School } from 'lucide-react';
import { AuthContext } from '../auth/AuthContext';
import { AuthRepository } from '../api/repository';

const LoginScreen = () => {
    const { login } = useContext(AuthContext);
    const [identifier, setIdentifier] = useState(''); // Email o Matricula
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = await AuthRepository.login(identifier, password);
            login(user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-blue-600 p-3 rounded-xl">
                        <School className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900">Asiste</h2>
                <p className="mt-2 text-sm text-slate-600">Asistencia académica, clara y organizada</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700" htmlFor="field-1">Email o Matrícula</label>
                            <input id="field-1"
                                type="text" required autoComplete="username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="docente@example.test"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700" htmlFor="field-2">Contraseña</label>
                            <input id="field-2"
                                type="password" required autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••"
                            />
                        </div>

                        {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}

                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
