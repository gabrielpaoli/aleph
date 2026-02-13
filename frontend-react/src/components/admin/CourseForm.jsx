// components/admin/CourseForm.jsx

import React, { useState, useEffect } from 'react';
import { courseService } from '../../services/api';

const CourseForm = () => {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    shift: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const ITEMS_PER_PAGE = 10;

  // Cargar datos al montar
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      console.log('📥 Cargando cursos de Drupal...');
      const coursesData = await courseService.getAll();
      console.log('✅ Cursos cargados:', coursesData);
      setCourses(coursesData || []);
      setErrorMessage('');
      setCurrentPage(0);
    } catch (error) {
      console.error('❌ Error cargando cursos:', error);
      setErrorMessage('Error al cargar cursos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.shift) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingId) {
        // Actualizar
        console.log('📝 Actualizando curso:', editingId);
        const updated = await courseService.update(editingId, formData);
        setCourses(courses.map(c => c.id === editingId ? updated : c));
        setSuccessMessage('✅ Curso actualizado exitosamente');
      } else {
        // Crear
        console.log('➕ Creando nuevo curso');
        const newCourse = await courseService.create(formData);
        setCourses([...courses, newCourse]);
        setSuccessMessage('✅ Curso creado exitosamente');
      }

      setFormData({ name: '', shift: '' });
      setEditingId(null);
    } catch (error) {
      console.error('❌ Error guardando curso:', error);
      setErrorMessage('Error al guardar curso: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (course) => {
    setFormData(course);
    setEditingId(course.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este curso?')) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      console.log('🗑️ Eliminando curso:', id);
      await courseService.delete(id);
      setCourses(courses.filter(c => c.id !== id));
      setSuccessMessage('✅ Curso eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando curso:', error);
      setErrorMessage('Error al eliminar curso: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', shift: '' });
    setEditingId(null);
    setErrorMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-slate-600 font-semibold">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">📚 Gestionar Cursos</h3>
        <p className="text-slate-600">Agrega, edita o elimina cursos directamente en Drupal</p>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Mensaje de error */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-semibold">❌ Error</p>
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              📝 Nombre (ej: 1A)
            </label>
            <input
              type="text"
              placeholder="Nombre del curso"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              required
              disabled={submitting}
            />
          </div>

          {/* Turno */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              🕐 Turno
            </label>
            <select
              value={formData.shift}
              onChange={(e) => setFormData({...formData, shift: e.target.value})}
              className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              required
              disabled={submitting}
            >
              <option value="">Seleccionar turno</option>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '⏳ Guardando...' : (editingId ? '✏️ Actualizar Curso' : '➕ Agregar Curso')}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-6 bg-slate-400 text-white font-semibold py-3 rounded-lg hover:bg-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabla de cursos */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left p-4 font-semibold text-slate-700">📝 Nombre</th>
              <th className="text-left p-4 font-semibold text-slate-700">🕐 Turno</th>
              <th className="text-right p-4 font-semibold text-slate-700">⚙️ Acciones</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center p-6 text-slate-500">
                  No hay cursos disponibles
                </td>
              </tr>
            ) : (
              courses.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map(course => (
                <tr key={course.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="p-4">{course.name}</td>
                  <td className="p-4">{course.shift}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(course)}
                        disabled={submitting}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        disabled={submitting}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {courses.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span className="text-sm font-semibold text-slate-600">
              Página {currentPage + 1} de {Math.ceil(courses.length / ITEMS_PER_PAGE)}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(courses.length / ITEMS_PER_PAGE) - 1}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseForm;
