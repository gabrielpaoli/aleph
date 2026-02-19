// components/teacher/PeriodGradeManagement.jsx

import React, { useState, useEffect } from 'react';
import { periodGradeService, studentService, subjectService, courseService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PeriodGradeManagement = () => {
  const { user } = useAuth();

  const [periodGrades, setPeriodGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSearchDebounced, setStudentSearchDebounced] = useState('');
  const [filteredStudentList, setFilteredStudentList] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const [filters, setFilters] = useState({
    studentId: '',
    subjectId: '',
    academicYear: new Date().getFullYear()
  });

  const [formData, setFormData] = useState({
    studentId: '',
    subjectId: '',
    academicYear: new Date().getFullYear(),
    trimester_1: '',
    trimester_2: '',
    trimester_3: '',
    final_grade: '',
    recuperatorio_diciembre: '',
    recuperatorio_febrero: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

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
      console.log('📥 Cargando datos para Period Grades...');

      // Cargar estudiantes
      const studentsData = await studentService.getAll();

      // Cargar cursos
      const coursesData = await courseService.getAll();
      setCourses(coursesData || []);

      // Cargar materias del docente o todas si es admin/preceptor
      let teacherSubjects;
      if (user?.role === 'admin' || user?.role === 'preceptor') {
        teacherSubjects = await subjectService.getAll();
      } else if (user?.subjectIds?.length > 0) {
        const allSubjects = await subjectService.getAll();
        teacherSubjects = allSubjects.filter(s =>
          user.subjectIds.includes(s.id)
        );
      } else {
        teacherSubjects = [];
      }
      
      setSubjects(teacherSubjects);

      // Filtrar estudiantes por cursos del docente (si es docente)
      if (user?.role === 'docente' && teacherSubjects.length > 0) {
        const teacherCourseIds = new Set(
          teacherSubjects.map(subject => subject.courseId).filter(Boolean)
        );
        const filteredStudents = (studentsData || []).filter(student =>
          teacherCourseIds.has(Number(student.courseId))
        );
        setStudents(filteredStudents);
      } else {
        setStudents(studentsData || []);
      }

      await loadPeriodGrades();
      setErrorMessage('');
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setErrorMessage('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodGrades = async () => {
    try {
      const gradeFilters = {};
      
      if (filters.studentId) {
        gradeFilters.studentId = filters.studentId;
      }
      
      if (filters.subjectId) {
        gradeFilters.subjectId = filters.subjectId;
      } else if (user?.role === 'docente' && user?.subjectIds?.length > 0) {
        // Si es docente, filtrar por sus materias
        gradeFilters.subjectIds = user.subjectIds.join(',');
      }
      
      if (filters.academicYear) {
        gradeFilters.academicYear = filters.academicYear;
      }

      const data = await periodGradeService.getAll(gradeFilters);
      let gradesList = Array.isArray(data) ? data : [];

      // Si es docente, filtrar la tabla para mostrar solo sus estudiantes
      if (user?.role === 'docente' && user?.subjectIds?.length > 0) {
        const teacherSubjectIdSet = new Set(user.subjectIds.map(Number));
        gradesList = gradesList.filter(g => teacherSubjectIdSet.has(Number(g.subjectId)));
      }

      setPeriodGrades(gradesList);
    } catch (err) {
      console.error('❌ Error cargando period grades:', err);
      setErrorMessage('Error al cargar calificaciones de trimestre: ' + err.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleApplyFilters = () => {
    loadPeriodGrades();
  };

  const handleSelectStudent = (student) => {
    setFormData({ ...formData, studentId: student.id });
    setStudentSearch(`${student.firstName} ${student.lastName}`);
    setFilteredStudentList([]);
    setShowStudentDropdown(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateGrade = (grade) => {
    if (grade === '' || grade === null) return true; // Permitir vacío
    const num = parseFloat(grade);
    return !isNaN(num) && num >= 0 && num <= 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.studentId || !formData.subjectId || !formData.academicYear) {
      setErrorMessage('Por favor selecciona estudiante, materia y año académico');
      return;
    }

    // Validar calificaciones
    const grades = [
      formData.trimester_1,
      formData.trimester_2,
      formData.trimester_3,
      formData.final_grade,
      formData.recuperatorio_diciembre,
      formData.recuperatorio_febrero
    ];

    for (const grade of grades) {
      if (!validateGrade(grade)) {
        setErrorMessage('Las calificaciones deben estar entre 0 y 10');
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const dataToSend = {
        studentId: formData.studentId,
        subjectId: formData.subjectId,
        academicYear: parseInt(formData.academicYear),
        trimester_1: formData.trimester_1 !== '' ? parseFloat(formData.trimester_1) : null,
        trimester_2: formData.trimester_2 !== '' ? parseFloat(formData.trimester_2) : null,
        trimester_3: formData.trimester_3 !== '' ? parseFloat(formData.trimester_3) : null,
        final_grade: formData.final_grade !== '' ? parseFloat(formData.final_grade) : null,
        recuperatorio_diciembre: formData.recuperatorio_diciembre !== '' ? parseFloat(formData.recuperatorio_diciembre) : null,
        recuperatorio_febrero: formData.recuperatorio_febrero !== '' ? parseFloat(formData.recuperatorio_febrero) : null,
      };

      if (editingId) {
        console.log('✏️ Actualizando period grade:', editingId);
        await periodGradeService.update(editingId, dataToSend);
        console.log('✅ Period grade actualizado');
        setSuccessMessage('✅ Calificaciones de trimestre actualizadas correctamente');
      } else {
        console.log('➕ Creando nueva period grade:', dataToSend);
        const newPeriodGrade = await periodGradeService.create(dataToSend);
        console.log('✅ Period grade creado:', newPeriodGrade);
        setSuccessMessage('✅ Calificaciones de trimestre agregadas correctamente');
      }

      // Recargar datos
      await loadPeriodGrades();

      // Limpiar formulario
      handleCancel();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error guardando period grade:', error);
      const errorMsg = error.response?.data?.error || error.message;
      setErrorMessage('Error al guardar: ' + errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (periodGrade) => {
    const student = students.find(s => s.id === periodGrade.studentId);
    setFormData({
      studentId: periodGrade.studentId,
      subjectId: periodGrade.subjectId,
      academicYear: periodGrade.academicYear,
      trimester_1: periodGrade.trimester_1 ?? '',
      trimester_2: periodGrade.trimester_2 ?? '',
      trimester_3: periodGrade.trimester_3 ?? '',
      final_grade: periodGrade.final_grade ?? '',
      recuperatorio_diciembre: periodGrade.recuperatorio_diciembre ?? '',
      recuperatorio_febrero: periodGrade.recuperatorio_febrero ?? ''
    });
    setStudentSearch(student ? `${student.firstName} ${student.lastName}` : '');
    setEditingId(periodGrade.id);
    setErrorMessage('');
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar estas calificaciones de trimestre?')) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      console.log('🗑️ Eliminando period grade:', id);
      await periodGradeService.delete(id);
      console.log('✅ Period grade eliminado');

      await loadPeriodGrades();
      setSuccessMessage('✅ Calificaciones de trimestre eliminadas');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error eliminando period grade:', error);
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
      academicYear: new Date().getFullYear(),
      trimester_1: '',
      trimester_2: '',
      trimester_3: '',
      final_grade: '',
      recuperatorio_diciembre: '',
      recuperatorio_febrero: ''
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
    
    const course = courses.find(c => c.id === subject.courseId);
    const courseName = course ? course.name : '';
    
    return courseName ? `${subject.name} ${courseName}` : subject.name;
  };

  const getSubjectsForStudent = (studentId) => {
    if (!studentId) return subjects;

    const student = students.find(s => s.id === Number(studentId));
    if (!student || !student.courseId) return [];

    return subjects.filter(subject => subject.courseId === student.courseId);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Gestión de Notas por Trimestre</h2>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {/* Formulario para agregar/editar */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h3 className="text-xl font-bold mb-4">
          {editingId ? 'Editar Calificaciones de Trimestre' : 'Agregar Calificaciones de Trimestre'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Búsqueda de estudiante */}
            <div className="relative">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Estudiante *
              </label>
              <input
                type="text"
                placeholder="Buscar estudiante..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onFocus={() => setShowStudentDropdown(filteredStudentList.length > 0)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              />
              {showStudentDropdown && filteredStudentList.length > 0 && (
                <div className="absolute z-10 bg-white border rounded shadow-lg mt-1 max-h-60 overflow-y-auto w-full">
                  {filteredStudentList.map(student => (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {student.firstName} {student.lastName} - {student.email}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Materia */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Materia *
              </label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleFormChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                required
              >
                <option value="">Seleccionar materia</option>
                {getSubjectsForStudent(formData.studentId).map(subject => {
                  const course = courses.find(c => c.id === subject.courseId);
                  const displayName = course ? `${subject.name} ${course.name}` : subject.name;
                  return (
                    <option key={subject.id} value={subject.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Año Académico */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Año Académico *
              </label>
              <input
                type="number"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleFormChange}
                min="2020"
                max="2100"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                required
              />
            </div>
          </div>

          {/* Calificaciones de Trimestres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Trimestre 1
              </label>
              <input
                type="number"
                name="trimester_1"
                value={formData.trimester_1}
                onChange={handleFormChange}
                step="0.01"
                min="0"
                max="10"
                placeholder="0.00"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Trimestre 2
              </label>
              <input
                type="number"
                name="trimester_2"
                value={formData.trimester_2}
                onChange={handleFormChange}
                step="0.01"
                min="0"
                max="10"
                placeholder="0.00"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Trimestre 3
              </label>
              <input
                type="number"
                name="trimester_3"
                value={formData.trimester_3}
                onChange={handleFormChange}
                step="0.01"
                min="0"
                max="10"
                placeholder="0.00"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nota Final
              </label>
              <input
                type="number"
                name="final_grade"
                value={formData.final_grade}
                onChange={handleFormChange}
                step="0.01"
                min="0"
                max="10"
                placeholder="0.00"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Recuperatorio Diciembre
              </label>
              <input
                type="number"
                name="recuperatorio_diciembre"
                value={formData.recuperatorio_diciembre}
                onChange={handleFormChange}
                step="0.01"
                min="0"
                max="10"
                placeholder="0.00"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Recuperatorio Febrero
              </label>
              <input
                type="number"
                name="recuperatorio_febrero"
                value={formData.recuperatorio_febrero}
                onChange={handleFormChange}
                step="0.01"
                min="0"
                max="10"
                placeholder="0.00"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : (editingId ? 'Actualizar' : 'Agregar')}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h3 className="text-xl font-bold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Estudiante
            </label>
            <select
              name="studentId"
              value={filters.studentId}
              onChange={handleFilterChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="">Todos</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Materia
            </label>
            <select
              name="subjectId"
              value={filters.subjectId}
              onChange={handleFilterChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="">Todas</option>
              {getSubjectsForStudent(filters.studentId).map(subject => {
                const course = courses.find(c => c.id === subject.courseId);
                const displayName = course ? `${subject.name} ${course.name}` : subject.name;
                return (
                  <option key={subject.id} value={subject.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Año Académico
            </label>
            <input
              type="number"
              name="academicYear"
              value={filters.academicYear}
              onChange={handleFilterChange}
              min="2020"
              max="2100"
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de calificaciones */}
      <div className="bg-white shadow-md rounded overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estudiante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Materia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Año
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                T1
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                T2
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                T3
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Final
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Rec Dic
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Rec Feb
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {periodGrades.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                  No hay calificaciones de trimestre registradas
                </td>
              </tr>
            ) : (
              periodGrades.map(pg => (
                <tr key={pg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStudentName(pg.studentId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSubjectName(pg.subjectId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {pg.academicYear}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {pg.trimester_1 ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {pg.trimester_2 ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {pg.trimester_3 ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap font-bold">
                    {pg.final_grade ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {pg.recuperatorio_diciembre ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {pg.recuperatorio_febrero ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(pg)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(pg.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PeriodGradeManagement;
