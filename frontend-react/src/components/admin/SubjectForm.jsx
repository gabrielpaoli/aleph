// components/admin/SubjectForm.jsx

import React, { useState, useEffect } from 'react';
import { subjectService, courseService, userService } from '../../services/api';

const SubjectForm = () => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    courseId: ''
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📥 Cargando materias y cursos de Drupal...');
      
      const subjectsData = await subjectService.getAll();
      console.log('✅ Materias cargadas:', subjectsData);
      setSubjects(subjectsData || []);
      
      const coursesData = await courseService.getAll();
      console.log('✅ Cursos cargados:', coursesData);
      setCourses(coursesData || []);

      const teachersResponse = await userService.getTeachers();
      const teachersData = Array.isArray(teachersResponse?.users)
        ? teachersResponse.users
        : Array.isArray(teachersResponse)
          ? teachersResponse
          : [];
      console.log('✅ Docentes cargados:', teachersData);
      setTeachers(teachersData);
      
      setErrorMessage('');
      setCurrentPage(0);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setErrorMessage('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.courseId) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingId) {
        // Actualizar
        console.log('📝 Actualizando materia:', editingId);
        const updated = await subjectService.update(editingId, formData);
        setSubjects(subjects.map(s => s.id === editingId ? updated : s));
        setSuccessMessage('✅ Materia actualizada exitosamente');
      } else {
        // Crear
        console.log('➕ Creando nueva materia');
        const newSubject = await subjectService.create(formData);
        setSubjects([...subjects, newSubject]);
        setSuccessMessage('✅ Materia creada exitosamente');
      }

      setFormData({ name: '', courseId: '' });
      setEditingId(null);
    } catch (error) {
      console.error('❌ Error guardando materia:', error);
      setErrorMessage('Error al guardar materia: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subject) => {
    setFormData(subject);
    setEditingId(subject.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta materia?')) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      console.log('🗑️ Eliminando materia:', id);
      await subjectService.delete(id);
      setSubjects(subjects.filter(s => s.id !== id));
      setSuccessMessage('✅ Materia eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando materia:', error);
      setErrorMessage('Error al eliminar materia: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', courseId: '' });
    setEditingId(null);
    setErrorMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-slate-600 font-semibold">Cargando materias...</p>
        </div>
      </div>
    );
  }

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? `${course.name} - ${course.shift}` : 'N/A';
  };

  const getTeacherNamesBySubject = (subjectId) => {
    const assigned = teachers.filter(teacher =>
      Array.isArray(teacher.subjectIds) && teacher.subjectIds.includes(subjectId)
    );

    if (assigned.length === 0) {
      return 'Sin asignar';
    }

    return assigned.map(teacher => teacher.name || teacher.email).join(', ');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">📖 Gestionar Materias</h3>
        <p className="text-slate-600">Agrega, edita o elimina materias directamente en Drupal</p>
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
      <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              📖 Nombre de la Materia
            </label>
            <input
              type="text"
              placeholder="Ej: Matemáticas, Lengua, Biología"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              required
              disabled={submitting}
            />
          </div>

          {/* Curso */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              📚 Curso
            </label>
            <select
              value={formData.courseId}
              onChange={(e) => setFormData({...formData, courseId: Number(e.target.value)})}
              className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              required
              disabled={submitting}
            >
              <option value="">Seleccionar curso</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} - {course.shift}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '⏳ Guardando...' : (editingId ? '✏️ Actualizar Materia' : '➕ Agregar Materia')}
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

      {/* Tabla de materias */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left p-4 font-semibold text-slate-700">📖 Materia</th>
              <th className="text-left p-4 font-semibold text-slate-700">📚 Curso</th>
              <th className="text-left p-4 font-semibold text-slate-700">👨‍🏫 Docente</th>
              <th className="text-right p-4 font-semibold text-slate-700">⚙️ Acciones</th>
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center p-6 text-slate-500">
                  No hay materias disponibles
                </td>
              </tr>
            ) : (
              subjects.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map(subject => (
                <tr key={subject.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="p-4">{subject.name}</td>
                  <td className="p-4">{subject.courseName || getCourseName(subject.courseId)}</td>
                  <td className="p-4">{getTeacherNamesBySubject(subject.id)}</td>
                  <td className="p-4">
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(subject)}
                        disabled={submitting}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
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
        </div>

        {/* Paginación */}
        {subjects.length > ITEMS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span className="text-sm font-semibold text-slate-600">
              Página {currentPage + 1} de {Math.ceil(subjects.length / ITEMS_PER_PAGE)}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(subjects.length / ITEMS_PER_PAGE) - 1}
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

export default SubjectForm;
