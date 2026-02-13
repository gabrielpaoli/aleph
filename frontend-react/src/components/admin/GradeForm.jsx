// components/admin/GradeForm.jsx

import React, { useState, useEffect } from 'react';
import { gradeService, studentService, subjectService } from '../../services/api';

const GradeForm = () => {
  const [grades, setGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [students, setStudents] = useState([]); // Cargar de Drupal
  const [subjects, setSubjects] = useState([]); // Cargar de Drupal
  const [studentSearch, setStudentSearch] = useState(''); // Búsqueda de estudiante
  const [studentSearchDebounced, setStudentSearchDebounced] = useState(''); // Búsqueda con debounce
  const [filteredStudentList, setFilteredStudentList] = useState([]); // Sugerencias filtradas
  const [showStudentDropdown, setShowStudentDropdown] = useState(false); // Mostrar/ocultar dropdown
  
  const [formData, setFormData] = useState({
    studentId: '',
    subjectId: '',
    grade: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [filters, setFilters] = useState({
    studentId: '',
    subjectId: ''
  });
  
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const ITEMS_PER_PAGE = 10;

  // Cargar datos al montar
  useEffect(() => {
    loadAllData();
  }, []);

  // Aplicar filtros cuando cambian las calificaciones
  useEffect(() => {
    applyFilters();
    setCurrentPage(0); // Resetear a primera página
  }, [grades, filters]);

  // Debounce para la búsqueda de estudiantes
  useEffect(() => {
    const timer = setTimeout(() => {
      setStudentSearchDebounced(studentSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Filtrar estudiantes cuando cambia el texto de búsqueda (con debounce)
  useEffect(() => {
    // Si no hay búsqueda, limpiar y no mostrar dropdown
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

    setFilteredStudentList(filtered.slice(0, 10)); // Máximo 10 sugerencias
    // Solo mostrar dropdown si hay resultados
    setShowStudentDropdown(filtered.length > 0);
  }, [studentSearchDebounced, students])

  const loadAllData = async () => {
    try {
      setLoading(true);
      console.log('📥 Cargando datos del backend...');
      
      // Cargar calificaciones
      const gradesData = await gradeService.getAll();
      console.log('✅ Calificaciones cargadas:', gradesData);
      setGrades(gradesData || []);
      
      // Cargar estudiantes de Drupal (NO de dummy)
      console.log('📥 Cargando estudiantes de Drupal...');
      const studentsData = await studentService.getAll();
      console.log('✅ Estudiantes cargados de Drupal:', studentsData);
      setStudents(studentsData || []);
      
      // Cargar materias de Drupal
      console.log('📥 Cargando materias de Drupal...');
      const subjectsData = await subjectService.getAll();
      console.log('✅ Materias cargadas de Drupal:', subjectsData);
      setSubjects(subjectsData || []);
      
      setErrorMessage('');
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setErrorMessage('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = grades;
    
    if (filters.studentId) {
      filtered = filtered.filter(g => g.studentId === Number(filters.studentId));
    }
    
    if (filters.subjectId) {
      filtered = filtered.filter(g => g.subjectId === Number(filters.subjectId));
    }
    
    setFilteredGrades(filtered);
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
        // Actualizar calificación existente
        console.log('✏️ Actualizando calificación:', editingId);
        await gradeService.update(editingId, formData);
        console.log('✅ Calificación actualizada');
        setSuccessMessage('✅ Calificación actualizada correctamente');
        
        // Actualizar en el estado local
        setGrades(grades.map(g =>
          g.id === editingId 
            ? { ...g, ...formData } 
            : g
        ));
        setEditingId(null);
      } else {
        // Crear nueva calificación
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

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error guardando calificación:', error);
      setErrorMessage('Error al guardar: ' + (error.response?.data?.error || error.message));
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
      setErrorMessage('Error al eliminar: ' + (error.response?.data?.error || error.message));
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

  const handleSelectStudent = (student) => {
    setFormData({ ...formData, studentId: student.id });
    setStudentSearch(`${student.firstName} ${student.lastName}`);
    setFilteredStudentList([]);
    setShowStudentDropdown(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-slate-600 font-semibold">Cargando calificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">📝 Gestionar Calificaciones</h3>
        <p className="text-slate-600">Agrega, edita o elimina calificaciones de estudiantes directamente en Drupal</p>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg animation-fade-out">
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
                  // Si el usuario empieza a escribir algo diferente, limpiar la selección anterior
                  // para permitir seleccionar otro estudiante
                  if (e.target.value.trim().length > 0) {
                    setFormData({...formData, studentId: ''});
                  }
                }}
                onFocus={() => studentSearch.length > 0 && setShowStudentDropdown(true)}
                className="w-full border-2 border-slate-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                required={!formData.studentId}
                disabled={submitting}
              />
              
              {/* Dropdown de sugerencias */}
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

              {/* Mensaje cuando no hay resultados */}
              {studentSearchDebounced.length > 0 && !showStudentDropdown && filteredStudentList.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-300 rounded-lg shadow-lg p-4 text-center text-slate-500">
                  No se encontraron estudiantes
                </div>
              )}

              {/* Botón para cambiar estudiante */}
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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '⏳ Guardando...' : (editingId ? '✏️ Actualizar Calificación' : '➕ Agregar Calificación')}
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

      {/* Filtros */}
      <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h4 className="font-semibold text-slate-700 mb-3">🔍 Filtrar Calificaciones</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filters.studentId}
            onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
            className="border-2 border-slate-300 p-2 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
          >
            <option value="">Todos los estudiantes</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName}
              </option>
            ))}
          </select>

          <select
            value={filters.subjectId}
            onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
            className="border-2 border-slate-300 p-2 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
          >
            <option value="">Todas las materias</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.courseName ? `${subject.name} (${subject.courseName})` : subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de calificaciones */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
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
              filteredGrades.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((grade, index) => (
                <tr key={grade.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-indigo-50 transition-colors`}>
                  <td className="p-4 text-slate-800">{getStudentName(grade.studentId)}</td>
                  <td className="p-4 text-slate-800">{getSubjectName(grade.subjectId)}</td>
                  <td className={`p-4 text-center font-bold rounded-lg ${getGradeColor(grade.grade)}`}>
                    {grade.grade}
                  </td>
                  <td className="p-4 text-center text-slate-600">
                    {new Date(grade.date).toLocaleDateString('es')}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
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
                  No hay calificaciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {filteredGrades.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span className="text-sm font-semibold text-slate-600">
              Página {currentPage + 1} de {Math.ceil(filteredGrades.length / ITEMS_PER_PAGE)}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(filteredGrades.length / ITEMS_PER_PAGE) - 1}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
        <p className="font-semibold">📊 Total de calificaciones: {grades.length}</p>
        <p className="text-sm mt-1">🔄 Sincronizadas con Drupal en tiempo real</p>
      </div>
    </div>
  );
};

export default GradeForm;
