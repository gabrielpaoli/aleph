// components/admin/TeacherManagement.jsx

import React, { useState, useEffect } from 'react';
import { userService, subjectService } from '../../services/api';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    subjectIds: [],
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadTeachers();
    loadSubjects();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📥 Loading teachers...');
      const response = await userService.getTeachers();
      console.log('✅ Teachers loaded:', response);
      setTeachers(Array.isArray(response.users) ? response.users : []);
    } catch (err) {
      console.error('❌ Error loading teachers:', err);
      setError('Error al cargar docentes: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectService.getAll();
      setSubjects(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('❌ Error loading subjects:', err);
    }
  };

  const startEdit = (teacher) => {
    setEditingTeacherId(teacher.id);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      password: '', // Clear password for editing
      subjectIds: teacher.subjectIds || [],
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingTeacherId(null);
    setFormData({ name: '', email: '', password: '', subjectIds: [] });
    setShowForm(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name || !formData.email) {
      setErrorMessage('Nombre y email son requeridos');
      return;
    }

    if (!editingTeacherId && !formData.password) {
      setErrorMessage('La contraseña es requerida para nuevos docentes');
      return;
    }

    try {
      if (editingTeacherId) {
        // Update existing teacher (user)
        const updateData = {
          name: formData.name,
          email: formData.email,
          subjectIds: formData.subjectIds,
        };
        // Only include password if it's not empty
        if (formData.password) {
          updateData.password = formData.password;
        }
        const response = await userService.updateTeacher(editingTeacherId, updateData);
        if (response) {
          setSuccessMessage(`Docente ${formData.name} actualizado exitosamente`);
          loadTeachers();
          setTimeout(resetForm, 2000);
        }
      } else {
        // Create new teacher (user with docente role)
        const response = await userService.createTeacher({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          subjectIds: formData.subjectIds,
        });
        if (response) {
          setSuccessMessage(`Docente ${formData.name} creado exitosamente`);
          loadTeachers();
          setTimeout(resetForm, 2000);
        }
      }
    } catch (err) {
      console.error('Error saving teacher:', err);
      setErrorMessage('Error al guardar docente: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar al docente ${name}?`)) {
      return;
    }

    try {
      await userService.delete(id);
      setSuccessMessage(`Docente ${name} eliminado exitosamente`);
      loadTeachers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setErrorMessage('Error al eliminar docente: ' + (err.response?.data?.error || err.message));
    }
  };

  const toggleSubject = (subjectId) => {
    setFormData(prev => {
      const subjectIds = prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter(id => id !== subjectId)
        : [...prev.subjectIds, subjectId];
      return { ...prev, subjectIds };
    });
  };

  const getSubjectNames = (subjectIds) => {
    if (!subjectIds || subjectIds.length === 0) return 'Sin materias asignadas';
    return subjectIds.map(id => {
      const subject = subjects.find(s => s.id === id);
      if (!subject) return `ID: ${id}`;
      return subject.courseName ? `${subject.name} (${subject.courseName})` : subject.name;
    }).join(', ');
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Docentes</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Nuevo Docente
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-4 sm:p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">
            {editingTeacherId ? 'Editar Docente' : 'Nuevo Docente'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="docente@ejemplo.com"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña {editingTeacherId ? '(dejar en blanco para no cambiar)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={editingTeacherId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                required={!editingTeacherId}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materias Asignadas
              </label>
              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {subjects.length === 0 && (
                  <p className="text-gray-500 text-sm">No hay materias disponibles</p>
                )}
                {(() => {
                  // Agrupar materias por nombre
                  const groupedSubjects = subjects.reduce((acc, subject) => {
                    if (!acc[subject.name]) {
                      acc[subject.name] = [];
                    }
                    acc[subject.name].push(subject);
                    return acc;
                  }, {});

                  // Ordenar los nombres de materias
                  const sortedSubjectNames = Object.keys(groupedSubjects).sort();

                  return sortedSubjectNames.map(subjectName => (
                    <div key={subjectName} className="mb-3 last:mb-0">
                      <div className="font-semibold text-gray-800 mb-1 text-sm">{subjectName}</div>
                      <div className="ml-4 space-y-1">
                        {groupedSubjects[subjectName]
                          .sort((a, b) => (a.courseName || '').localeCompare(b.courseName || ''))
                          .map(subject => (
                            <label key={subject.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                              <input
                                type="checkbox"
                                checked={formData.subjectIds.includes(subject.id)}
                                onChange={() => toggleSubject(subject.id)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-600">
                                {subject.courseName || 'Sin curso asignado'}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingTeacherId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="text-center py-4">Cargando docentes...</p>}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Materias
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No hay docentes registrados
                  </td>
                </tr>
              )}
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {teacher.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {teacher.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {teacher.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate" title={getSubjectNames(teacher.subjectIds)}>
                      {getSubjectNames(teacher.subjectIds)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => startEdit(teacher)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id, teacher.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
