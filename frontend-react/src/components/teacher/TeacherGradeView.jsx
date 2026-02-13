// components/teacher/TeacherGradeView.jsx

import React, { useState, useEffect } from 'react';
import { gradeService, studentService, subjectService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TeacherGradeView = () => {
  const { user } = useAuth();
  
  const [grades, setGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [grades, subjects]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📥 Cargando datos para docente...');

      // Cargar todas las calificaciones
      const gradesData = await gradeService.getAll();
      setGrades(gradesData || []);

      // Cargar estudiantes
      const studentsData = await studentService.getAll();
      setStudents(studentsData || []);

      // Cargar materias del docente
      if (user?.subjectIds?.length > 0) {
        const allSubjects = await subjectService.getAll();
        const teacherSubjects = allSubjects.filter(s =>
          user.subjectIds.includes(s.id)
        );
        console.log('✅ Materias del docente:', teacherSubjects);
        setSubjects(teacherSubjects);
      }

      setError('');
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Filtrar solo calificaciones de sus materias
    const teacherSubjectIds = subjects.map(s => s.id);
    const filtered = grades.filter(g =>
      teacherSubjectIds.includes(g.subjectId)
    );
    console.log('📊 Calificaciones filtradas:', filtered.length, 'de', grades.length);
    setFilteredGrades(filtered);
    setCurrentPage(0);
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
          <p className="text-slate-600 font-semibold">Cargando calificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">📝 Calificaciones Registradas</h2>
          <p className="text-slate-600">Visualización de todas las calificaciones de tus estudiantes</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ❌ {error}
          </div>
        )}

        {/* Información de materias */}
        {subjects.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg text-blue-800">
            <p className="font-semibold">📚 Tus Materias: {subjects.map(s => s.name).join(', ')}</p>
            <p className="text-sm mt-1">Mostrando {filteredGrades.length} calificaciones</p>
          </div>
        )}

        {/* Tabla de calificaciones */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-700">Estudiante</th>
                <th className="text-left p-4 font-semibold text-slate-700">Materia</th>
                <th className="text-center p-4 font-semibold text-slate-700">Calificación</th>
                <th className="text-center p-4 font-semibold text-slate-700">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? (
                filteredGrades.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((grade, index) => (
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    📭 No hay calificaciones registradas en tus materias
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
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800">
          <p className="font-semibold">📊 Total de calificaciones: {filteredGrades.length}</p>
          <p className="text-sm mt-1">🔄 Sincronizadas con el sistema en tiempo real</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherGradeView;
