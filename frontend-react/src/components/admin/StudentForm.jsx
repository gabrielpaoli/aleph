// components/admin/StudentForm.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentService, courseService } from '../../services/api'; // ← Agregar courseService

const StudentForm = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
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

      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Nombre"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          className="border-2 border-slate-200 p-2 rounded-lg focus:border-indigo-500 focus:outline-none"
          required
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Apellido"
          value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          className="border-2 border-slate-200 p-2 rounded-lg focus:border-indigo-500 focus:outline-none"
          required
          disabled={loading}
        />
        <input
          type="email"
          placeholder="Email del padre"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="border-2 border-slate-200 p-2 rounded-lg focus:border-indigo-500 focus:outline-none"
          required
          disabled={loading}
        />
        <select
          value={formData.courseId}
          onChange={(e) => setFormData({...formData, courseId: Number(e.target.value)})}
          className="border-2 border-slate-200 p-2 rounded-lg focus:border-indigo-500 focus:outline-none"
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

        <div className="col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Guardando...' : (editingId ? '✏️ Actualizar' : '➕ Agregar')} Estudiante
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
          <tr className="border-b-2 border-slate-200 bg-slate-50">
            <th className="text-left p-3 font-semibold">Nombre</th>
            <th className="text-left p-3 font-semibold">Apellido</th>
            <th className="text-left p-3 font-semibold">Email</th>
            <th className="text-left p-3 font-semibold">Curso</th>
            <th className="text-left p-3 font-semibold">Acciones</th>
          </tr>
          </thead>
          <tbody>
          {students.map(student => {
            const course = courses.find(c => c.id === student.courseId);
            return (
              <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="p-3">
                  <Link
                    to={`/estudiante/${student.id}`}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    {student.firstName}
                  </Link>
                </td>
                <td className="p-3">{student.lastName}</td>
                <td className="p-3 text-sm text-slate-600">{student.email}</td>
                <td className="p-3">
                  {course ? (
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                        {course.name} - {course.shift}
                      </span>
                  ) : (
                    <span className="text-slate-400 text-sm">Sin curso</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link
                      to={`/estudiante/${student.id}`}
                      className="text-emerald-600 hover:underline text-sm font-medium"
                    >
                      👁️ Ver
                    </Link>
                    <button
                      onClick={() => handleEdit(student)}
                      disabled={loading}
                      className="text-blue-600 hover:underline text-sm font-medium disabled:opacity-50"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      disabled={loading}
                      className="text-red-600 hover:underline text-sm font-medium disabled:opacity-50"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      {students.length === 0 && !loading && (
        <div className="text-center py-8 text-slate-500">
          No hay estudiantes registrados
        </div>
      )}
    </div>
  );
};

export default StudentForm;
