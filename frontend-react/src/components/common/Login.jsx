// components/common/Login.jsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  // Forgot-password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(email, password);

    if (!result.success) {
      setError(result.error);
    }
  };

  const quickLogin = (userEmail, userPassword = 'password') => {
    setEmail(userEmail);
    const result = login(userEmail, userPassword);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    if (!forgotEmail.trim()) {
      setForgotError('Ingresá tu correo electrónico.');
      return;
    }
    setForgotLoading(true);
    try {
      const result = await authService.forgotPassword(forgotEmail.trim());
      setForgotMsg(result.message || 'Si el correo existe, recibirás un enlace en breve.');
    } catch {
      setForgotError('Error al enviar. Intentá nuevamente.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4 py-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <img
            src="https://colegiodelprado.com/wp-content/uploads/2024/08/transparent-background-no-shadow-designify-1.png"
            alt="Colegio del Prado"
            className="h-16 sm:h-20 w-auto mx-auto mb-3"
          />
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Sistema Escolar</h2>
          <p className="text-slate-500 mt-2">
            {showForgot ? 'Recuperar contraseña' : 'Iniciar Sesión'}
          </p>
        </div>

        {/* ── Login form ── */}
        {!showForgot && (
          <>
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

              <div className="mb-2">
                <label className="block text-slate-700 mb-2 font-medium">Contraseña:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="Tu contraseña"
                  required
                />
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end mb-5">
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotEmail(email); setError(''); }}
                  className="text-sm text-indigo-500 hover:text-indigo-700 hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
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
                  onClick={() => quickLogin('preceptor@escuela1.com', '1234')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium shadow-sm"
                >
                  👨‍🏫 Entrar como Preceptor
                </button>

                <button
                  onClick={() => quickLogin('padre.perez@email.com', '1234')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all text-sm font-medium shadow-sm"
                >
                  👨‍👩‍👦 Entrar como Padre (Juan Pérez)
                </button>

                <button
                  onClick={() => quickLogin('padre.gonzalez@email.com', '1234')}
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
          </>
        )}

        {/* ── Forgot password form ── */}
        {showForgot && (
          <div>
            {forgotMsg ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="text-5xl">📬</div>
                <p className="text-center text-slate-700 text-sm leading-relaxed">{forgotMsg}</p>
                <button
                  onClick={() => { setShowForgot(false); setForgotMsg(''); setForgotEmail(''); }}
                  className="mt-2 text-indigo-600 hover:underline text-sm font-medium"
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-sm text-slate-500 mb-2">
                  Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                <div>
                  <label className="block text-slate-700 mb-2 font-medium text-sm">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                    className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder="usuario@email.com"
                    autoFocus
                  />
                </div>

                {forgotError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm">
                    {forgotError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all font-semibold shadow-md disabled:opacity-60"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setForgotError(''); setForgotEmail(''); }}
                  className="w-full text-slate-500 hover:text-slate-700 text-sm py-2 transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

