// components/common/Login.jsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(email, password);

    if (!result.success) {
      setError(result.error);
    }
  };

  const quickLogin = (userEmail) => {
    setEmail(userEmail);
    const result = login(userEmail, 'password');
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-slate-200">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎓</div>
          <h2 className="text-3xl font-bold text-slate-800">Sistema Escolar</h2>
          <p className="text-slate-500 mt-2">Iniciar Sesión</p>
        </div>

        {error && (
          <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-slate-700 mb-2 font-medium">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="usuario@email.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-slate-700 mb-2 font-medium">Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="Cualquier contraseña"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all font-semibold shadow-md mb-4"
          >
            Ingresar
          </button>
        </form>

        <div className="border-t-2 border-slate-200 pt-4">
          <p className="text-sm font-semibold mb-3 text-slate-700">Acceso rápido:</p>

          <div className="space-y-2">
            <button
              onClick={() => quickLogin('preceptor@escuela1.com')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium shadow-sm"
            >
              👨‍🏫 Entrar como Preceptor
            </button>

            <button
              onClick={() => quickLogin('padre.perez@email.com')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all text-sm font-medium shadow-sm"
            >
              👨‍👩‍👦 Entrar como Padre (Juan Pérez)
            </button>

            <button
              onClick={() => quickLogin('padre.gonzalez@email.com')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all text-sm font-medium shadow-sm"
            >
              👨‍👩‍👦 Entrar como Padre (María González)
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="font-semibold mb-1">💡 Modo desarrollo:</p>
          <p>Cualquier contraseña es válida. Solo importa el email.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
