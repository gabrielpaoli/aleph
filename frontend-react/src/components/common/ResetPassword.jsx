// components/common/ResetPassword.jsx

import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const uid       = params.get('uid');
  const timestamp = params.get('timestamp');
  const hash      = params.get('hash');

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');

  // Invalid link (missing params)
  if (!uid || !timestamp || !hash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Enlace inválido</h2>
          <p className="text-slate-500 text-sm mb-6">
            El enlace de recuperación no es válido o está incompleto.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:underline text-sm font-medium"
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Completá ambos campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword(
        Number(uid),
        Number(timestamp),
        hash,
        newPassword
      );

      if (result.success) {
        setSuccess(result.message || 'Contraseña actualizada correctamente.');
      } else {
        setError(result.error || 'No se pudo actualizar la contraseña.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        'Error al conectar con el servidor. Intentá nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4 py-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">

        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="https://colegiodelprado.com/wp-content/uploads/2024/08/transparent-background-no-shadow-designify-1.png"
            alt="Colegio del Prado"
            className="h-16 sm:h-20 w-auto mx-auto mb-3"
          />
          <h2 className="text-2xl font-bold text-slate-800">Nueva contraseña</h2>
          <p className="text-slate-500 mt-1 text-sm">Ingresá tu nueva contraseña</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-5xl">✅</div>
            <p className="text-center text-slate-700 text-sm leading-relaxed">{success}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-6 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md text-sm"
            >
              Iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-700 mb-2 font-medium text-sm">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                autoFocus
                autoComplete="new-password"
                className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2 font-medium text-sm">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                autoComplete="new-password"
                className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Repetí la nueva contraseña"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
                <span className="mt-0.5">❌</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all font-semibold shadow-md disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-slate-500 hover:text-slate-700 text-sm py-2 transition-colors"
            >
              ← Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
