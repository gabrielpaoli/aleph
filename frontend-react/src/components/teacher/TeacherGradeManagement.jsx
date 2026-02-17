// components/teacher/TeacherGradeManagement.jsx

import React, { useState, useEffect } from 'react';
import { gradeService, studentService, subjectService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TeacherGradeManagement = () => {
  const { user } = useAuth();

  const [grades, setGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSearchDebounced, setStudentSearchDebounced] = useState('');
  const [filteredStudentList, setFilteredStudentList] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    subjectId: '',
    grade: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gradesPage, setGradesPage] = useState(1);
  const [gradesPages, setGradesPages] = useState(1);
  const [gradesTotal, setGradesTotal] = useState(0);

  const GRADES_LIMIT = 50;

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!loading) {
      loadGrades(gradesPage);
    }
  }, [gradesPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStudentSearchDebounced(studentSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  useEffect(() => {
    if (studentSearchDebounced.trim().length === 0) {
      setFilteredStudentList([]);
      setShowStudentDropdown(false);
      return;
    }

    const term = studentSearchDebounced.toLowerCase();
    const filtered = students.filter(student =>
      student.firstName.toLowerCase().includes(term) ||
      student.lastName.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term)
    );

    setFilteredStudentList(filtered.slice(0, 10));
    setShowStudentDropdown(filtered.length > 0);
  }, [studentSearchDebounced, students]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📥 Cargando datos para docente...');

      // Cargar todos los estudiantes
      const studentsData = await studentService.getAll();

      // Cargar materias del docente
      if (user?.subjectIds?.length > 0) {
        const allSubjects = await subjectService.getAll();
        const teacherSubjects = allSubjects.filter(s =>
          user.subjectIds.includes(s.id)
        );
        console.log('✅ Materias del docente:', teacherSubjects);
        setSubjects(teacherSubjects);

        // Filtrar estudiantes solo de los cursos del docente
        const teacherCourseIds = new Set(
          teacherSubjects.map(subject => subject.courseId).filter(Boolean)
        );
        const filteredStudents = (studentsData || []).filter(student =>
          teacherCourseIds.has(student.courseId)
        );
        console.log('✅ Estudiantes del docente:', filteredStudents.length, 'de', studentsData.length);
        setStudents(filteredStudents);
      } else {
        setStudents(studentsData || []);
      }

      await loadGrades(1);
      setGradesPage(1);

      setErrorMessage('');
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setErrorMessage('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async (page = gradesPage) => {
    const gradeFilters = {};
    if (user?.subjectIds?.length > 0) {
      gradeFilters.subjectIds = user.subjectIds.join(',');
    }

    const gradesData = await gradeService.getAll(page, GRADES_LIMIT, gradeFilters);
    const gradeItems = Array.isArray(gradesData) ? gradesData : (gradesData?.items || []);

    setGrades(gradeItems);
    setFilteredGrades(gradeItems);

    if (!Array.isArray(gradesData)) {
      setGradesTotal(gradesData.total ?? gradeItems.length);
      setGradesPages(gradesData.pages ?? 1);
    } else {
      setGradesTotal(gradeItems.length);
      setGradesPages(1);
    }
  };

  const handleSelectStudent = (student) => {
    setFormData({ ...formData, studentId: student.id });
    setStudentSearch(`${student.firstName} ${student.lastName}`);
    setFilteredStudentList([]);
    setShowStudentDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.studentId || !formData.subjectId || !formData.grade) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    if (formData.grade < 0 || formData.grade > 10) {
      setErrorMessage('La calificación debe estar entre 0 y 10');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      if (editingId) {
        console.log('✏️ Actualizando calificación:', editingId);
        await gradeService.update(editingId, formData);
        console.log('✅ Calificación actualizada');
        setSuccessMessage('✅ Calificación actualizada correctamente');

        setGrades(grades.map(g =>
          g.id === editingId 
            ? { ...g, ...formData } 
            : g
        ));
        setEditingId(null);
      } else {
        console.log('➕ Creando nueva calificación:', formData);
        const newGrade = await gradeService.create(formData);
        console.log('✅ Calificación creada:', newGrade);
        setGrades([...grades, newGrade]);
        setSuccessMessage('✅ Calificación agregada correctamente');
      }

      // Limpiar formulario
      setFormData({
        studentId: '',
        subjectId: '',
        grade: '',
        date: new Date().toISOString().split('T')[0]
      });
      setStudentSearch('');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error guardando calificación:', error);
      const errorMsg = error.response?.data?.error || error.message;
      setErrorMessage('Error al guardar: ' + errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (grade) => {
    const student = students.find(s => s.id === grade.studentId);
    setFormData(grade);
    setStudentSearch(student ? `${student.firstName} ${student.lastName}` : '');
    setEditingId(grade.id);
    setErrorMessage('');
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta calificación?')) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      console.log('🗑️ Eliminando calificación:', id);
      await gradeService.delete(id);
      console.log('✅ Calificación eliminada');

      setGrades(grades.filter(g => g.id !== id));
      setSuccessMessage('✅ Calificación eliminada');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error eliminando calificación:', error);
      const errorMsg = error.response?.data?.error || error.message;
      setErrorMessage('Error al eliminar: ' + errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      studentId: '',
      subjectId: '',
      grade: '',
      date: new Date().toISOString().split('T')[0]
    });
    setStudentSearch('');
    setFilteredStudentList([]);
    setShowStudentDropdown(false);
    setEditingId(null);
    setErrorMessage('');
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'N/A';
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return 'N/A';
    return subject.courseName ? `${subject.name} (${subject.courseName})` : subject.name;
  };

  const getGradeColor = (grade) => {
    if (grade >= 7) return 'text-green-600 bg-green-50';
    if (grade >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-slate-600 font-semibold">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">⭐ Gestionar Calificaciones</h2>
          <p className="text-slate-600">Agrega, edita o visualiza calificaciones de tus estudiantes</p>
        </div>

        {/* Mensajes */}
        {successMessage && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg animation-fade-out">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">❌ Error</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Información de materias */}
        {subjects.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg text-blue-800">
            <p className="font-semibold">📚 Tus Materias: {subjects.map(s => s.name).join(', ')}</p>
            <p className="text-sm mt-1">Solo puedes agregar calificaciones en estas materias</p>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">📝 Agregar/Editar Calificación</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estudiante */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  👨‍🎓 Estudiante
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Busca por nombre, apellido o email..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      if (e.target.value.trim().length > 0) {
                        setFormData({...formData, studentId: ''});
                      }
                    }}
                    onFocus={() => studentSearch.length > 0 && setShowStudentDropdown(true)}
                    className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    required={!formData.studentId}
                    disabled={submitting}
                  />

                  {showStudentDropdown && filteredStudentList.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredStudentList.map(student => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-200 last:border-b-0 transition-colors"
                        >
                          <div className="font-semibold text-slate-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-slate-600">
                            {student.email}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {formData.studentId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({...formData, studentId: ''});
                        setStudentSearch('');
                        setFilteredStudentList([]);
                        setShowStudentDropdown(false);
                      }}
                      className="absolute right-3 top-11 text-sm bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300 transition-colors font-semibold"
                    >
                      ✓ Cambiar
                    </button>
                  )}
                </div>
              </div>

              {/* Materia */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📚 Materia
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: Number(e.target.value) })}
                  className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                  disabled={submitting}
                >
                  <option value="">Seleccionar materia</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.courseName ? `${subject.name} (${subject.courseName})` : subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calificación */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ⭐ Calificación (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="ej: 8.5"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                  className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📅 Fecha
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '⏳ Guardando...' : (editingId ? '✏️ Actualizar' : '➕ Agregar Calificación')}
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
        </div>

        {/* Tabla de calificaciones */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">📋 Calificaciones Registradas</h3>
            <p className="text-slate-600 text-sm mt-1">Total: {gradesTotal} calificaciones</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-700">Estudiante</th>
                <th className="text-left p-4 font-semibold text-slate-700">Materia</th>
                <th className="text-center p-4 font-semibold text-slate-700">Calificación</th>
                <th className="text-center p-4 font-semibold text-slate-700">Fecha</th>
                <th className="text-right p-4 font-semibold text-slate-700">⚙️ Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((grade, index) => (
                  <tr
                    key={grade.id}
                    className={`border-b border-slate-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-indigo-50 transition-colors`}
                  >
                    <td className="p-4 text-slate-800 font-medium">
                      {getStudentName(grade.studentId)}
                    </td>
                    <td className="p-4 text-slate-800">
                      {getSubjectName(grade.subjectId)}
                    </td>
                    <td className={`p-4 text-center font-bold rounded-lg ${getGradeColor(grade.grade)}`}>
                      {grade.grade}
                    </td>
                    <td className="p-4 text-center text-slate-600 text-sm">
                      {new Date(grade.date).toLocaleDateString('es')}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(grade)}
                          disabled={submitting}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(grade.id)}
                          disabled={submitting}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    📭 No hay calificaciones registradas aún
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>

          {/* Paginación */}
          {gradesPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setGradesPage(Math.max(1, gradesPage - 1))}
                disabled={gradesPage === 1}
                className="px-4 py-2 bg-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <span className="text-sm font-semibold text-slate-600">
                Página {gradesPage} de {gradesPages}
              </span>
              <button
                onClick={() => setGradesPage(Math.min(gradesPages, gradesPage + 1))}
                disabled={gradesPage >= gradesPages}
                className="px-4 py-2 bg-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800">
          <p className="font-semibold">📊 Resumen: {gradesTotal} calificaciones en tus materias</p>
          <p className="text-sm mt-1">🔄 Sincronizadas con el sistema en tiempo real</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherGradeManagement;
