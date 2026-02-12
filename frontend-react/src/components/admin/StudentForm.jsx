// components/admin/StudentForm.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentService, courseService } from '../../services/api'; // ← Agregar courseService

const StudentForm = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    courseId: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar estudiantes y cursos al montar
  useEffect(() => {
    loadData();
  }, []);

  // Filtrar estudiantes cuando cambia la búsqueda o filtro
  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterCourse]);

  const filterStudents = () => {
    let filtered = students;

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(term) ||
        student.lastName.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term)
      );
    }

    // Filtrar por curso
    if (filterCourse) {
      filtered = filtered.filter(student => student.courseId === Number(filterCourse));
    }

    setFilteredStudents(filtered);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, coursesData] = await Promise.all([
        studentService.getAll(),
        courseService.getAll()
      ]);
      console.log('📥 Loaded students:', studentsData);
      console.log('📥 Loaded courses:', coursesData);
      setStudents(studentsData);
      setCourses(coursesData);
      setError(null);
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('📤 Submitting student:', formData);
    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        console.log('✏️ Updating student:', editingId);
        await studentService.update(editingId, formData);
        console.log('✅ Student updated successfully');
      } else {
        console.log('➕ Creating new student');
        const newStudent = await studentService.create(formData);
        console.log('✅ Student created:', newStudent);
      }

      await loadData();
      setFormData({ firstName: '', lastName: '', email: '', courseId: '' });
      setEditingId(null);

    } catch (err) {
      console.error('❌ Error saving student:', err);
      console.error('Error details:', err.response?.data);
      setError('Error al guardar: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    console.log('✏️ Editing student:', student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      courseId: student.courseId
    });
    setEditingId(student.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar estudiante?')) {
      return;
    }

    console.log('🗑️ Deleting student:', id);
    setLoading(true);
    setError(null);

    try {
      await studentService.delete(id);
      console.log('✅ Student deleted');
      await loadData();
    } catch (err) {
      console.error('❌ Error deleting student:', err);
      setError('Error al eliminar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ firstName: '', lastName: '', email: '', courseId: '' });
    setEditingId(null);
    setError(null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCourse('');
  };

  if (loading && students.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-xl">⏳ Cargando estudiantes...</div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Formulario de creación/edición */}
      <form onSubmit={handleSubmit} className="mb-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nombre"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            className="border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            required
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Apellido"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            className="border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email del padre"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            required
            disabled={loading}
          />
          <select
            value={formData.courseId}
            onChange={(e) => setFormData({...formData, courseId: Number(e.target.value)})}
            className="border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            required
            disabled={loading}
          >
            <option value="">Seleccionar curso</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name} - {course.shift}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Guardando...' : (editingId ? '✏️ Actualizar' : '➕ Agregar')} Estudiante
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 bg-slate-400 text-white py-3 rounded-lg hover:bg-slate-500 transition-colors font-semibold"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Buscador y filtros */}
      <div className="mb-6 bg-white p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">🔍 Buscar Estudiantes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre o Email</label>
            <input
              type="text"
              placeholder="Busca por nombre, apellido o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Curso</label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos los cursos</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} - {course.shift}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full bg-slate-200 text-slate-800 font-semibold py-3 rounded-lg hover:bg-slate-300 transition-colors"
            >
              🔄 Limpiar Filtros
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-600 mt-3">
          Mostrando <strong>{filteredStudents.length}</strong> de <strong>{students.length}</strong> estudiantes
        </p>
      </div>

      {/* Tabla de estudiantes */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-50">
              <th className="text-left p-4 font-semibold text-slate-700">👤 Nombre</th>
              <th className="text-left p-4 font-semibold text-slate-700">📛 Apellido</th>
              <th className="text-left p-4 font-semibold text-slate-700">📧 Email</th>
              <th className="text-left p-4 font-semibold text-slate-700">📚 Curso</th>
              <th className="text-right p-4 font-semibold text-slate-700">⚙️ Acciones</th>
            </tr>
            </thead>
            <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-slate-500">
                  {students.length === 0 ? 'No hay estudiantes registrados' : 'No se encontraron resultados'}
                </td>
              </tr>
            ) : (
              filteredStudents.map(student => {
                const course = courses.find(c => c.id === student.courseId);
                return (
                  <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <Link
                        to={`/estudiante/${student.id}`}
                        className="text-indigo-600 hover:underline font-semibold"
                      >
                        {student.firstName}
                      </Link>
                    </td>
                    <td className="p-4">{student.lastName}</td>
                    <td className="p-4 text-sm text-slate-600">{student.email}</td>
                    <td className="p-4">
                      {course ? (
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                          {course.name} - {course.shift}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Sin curso</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-end">
                        <Link
                          to={`/estudiante/${student.id}`}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-sm font-medium hover:bg-emerald-200 transition-colors"
                        >
                          👁️ Ver
                        </Link>
                        <button
                          onClick={() => handleEdit(student)}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;
