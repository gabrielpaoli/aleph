// components/admin/UserManagement.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('preceptor');
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'preceptor',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const ROLES = ['preceptor', 'docente', 'parent'];

  useEffect(() => {
    loadUsersByRole(selectedRole);
  }, [selectedRole]);

  const loadUsersByRole = async (role) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📥 Loading users for role:', role);
      const response = await userService.getByRole(role);
      console.log('✅ Users loaded:', response);
      setUsers(response.users || []);
    } catch (err) {
      console.error('❌ Error loading users:', err);
      console.error('   Response Status:', err.response?.status);
      console.error('   Response Data:', err.response?.data);
      console.error('   Message:', err.message);
      setError('Error al cargar usuarios: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (u) => {
    setEditingUserId(u.id);
    setFormData({
      email: u.email,
      name: u.name,
      password: '',
      role: u.roles?.[0] || selectedRole,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingUserId(null);
    setFormData({ email: '', password: '', name: '', role: 'preceptor' });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.email || !formData.name) {
      setErrorMessage('Email y nombre son requeridos');
      return;
    }

    // For new users, password is required
    if (!editingUserId && !formData.password) {
      setErrorMessage('La contraseña es requerida para nuevos usuarios');
      return;
    }

    try {
      if (editingUserId) {
        // Update existing user
        const updateData = {
          email: formData.email,
          name: formData.name,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await userService.update(editingUserId, updateData);
        if (response.success) {
          setSuccessMessage(`Usuario ${formData.email} actualizado exitosamente`);
        }
      } else {
        // Create new user
        const response = await userService.create({
          email: formData.email,
          password: formData.password,
          name: formData.name || formData.email,
          role: formData.role,
        });

        if (response.success) {
          setSuccessMessage(`Usuario ${formData.email} creado exitosamente`);
        }
      }

      resetForm();
      await loadUsersByRole(selectedRole);
    } catch (err) {
      setErrorMessage('Error: ' + (err.response?.data?.error || err.message));
      console.error('Error:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        const response = await userService.delete(userId);
        if (response.success) {
          setSuccessMessage('Usuario eliminado exitosamente');
          await loadUsersByRole(selectedRole);
        }
      } catch (err) {
        setErrorMessage('Error al eliminar usuario: ' + err.message);
        console.error('Error deleting user:', err);
      }
    }
  };

  if (!user || user.role !== 'directivo') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-bold">Acceso Denegado</h3>
        <p className="text-red-700">Solo los directivos pueden gestionar usuarios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">👥 Gestión de Usuarios</h2>

      {/* Mensajes */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">✓ {successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">✗ {errorMessage}</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">✗ {error}</p>
        </div>
      )}

      {/* Botón para crear usuario */}
      <button
        onClick={() => {
          if (!showForm) {
            resetForm();
          }
          setShowForm(!showForm);
        }}
        className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-md transition-all"
      >
        {showForm ? 'Cancelar' : '➕ Crear Nuevo Usuario'}
      </button>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold mb-4 text-slate-800">
            {editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="usuario@example.com"
                required
                disabled={editingUserId !== null}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Nombre completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {editingUserId ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'} *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                required={!editingUserId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rol *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="preceptor">Preceptor</option>
                <option value="docente">Docente</option>
                <option value="parent">Padre</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-md transition-all"
            >
              {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de usuarios por rol */}
      <div>
        <div className="mb-4 flex gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedRole === role
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}s
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          {loading ? (
            <p className="text-slate-600 text-center py-8">Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <p className="text-slate-600 text-center py-8">
              No hay usuarios con el rol {selectedRole}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Nombre</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Rol</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{u.email}</td>
                      <td className="px-4 py-3 text-slate-700">{u.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                          {u.roles ? u.roles.join(', ') : selectedRole}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          onClick={() => startEdit(u)}
                          className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-4 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
