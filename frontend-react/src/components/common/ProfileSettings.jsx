// components/common/ProfileSettings.jsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

const ROLE_LABELS = {
  preceptor: '👨‍🏫 Preceptor',
  directivo: '👔 Directivo',
  docente: '📚 Docente',
  parent: '👨‍👩‍👦 Padre / Madre',
  admin: '🔧 Administrador',
};

const ProfileSettings = () => {
  const { user } = useAuth();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.changePassword(form.currentPassword, form.newPassword);
      if (result.success) {
        setSuccess(result.message || 'Contraseña actualizada correctamente.');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(result.error || 'Error al actualizar la contraseña.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        'Error al comunicarse con el servidor. Intente nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona la información de tu cuenta</p>
      </div>

      {/* Tarjeta de información */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span>👤</span> Información de la cuenta
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
              Correo electrónico
            </span>
            <span className="text-gray-800 font-medium">{user?.email}</span>
          </div>
          <div>
            <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
              Rol
            </span>
            <span className="text-gray-800 font-medium">
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta de cambio de contraseña */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-6 flex items-center gap-2">
          <span>🔒</span> Cambiar contraseña
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="Ingresá tu contraseña actual"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                placeholder="Repetí la nueva contraseña"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <span className="mt-0.5">❌</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
              <span className="mt-0.5">✅</span>
              <span>{success}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm shadow-sm"
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
