// src/App.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ATTENDANCE_STATUS } from '../../services/dummyData';
import { studentService, courseService, subjectService, attendanceService, noteService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useGrades } from '../../hooks/useGrades';

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Convertir el ID a número
  const numericId = parseInt(studentId, 10);

  // Proteger acceso: si es padre, solo puede ver sus estudiantes
  useEffect(() => {
    if (user && user.role === 'parent') {
      const allowedStudents = user.studentIds && user.studentIds.length > 0 
        ? user.studentIds 
        : (user.studentId ? [user.studentId] : []);
      
      if (!allowedStudents.includes(numericId)) {
        console.warn('🚫 Parent trying to access a student they do not own');
        navigate('/estudiante');
        return;
      }
    }
  }, [user, numericId, navigate]);

  const [student, setStudent] = useState(null);
  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Usar custom hook para calificaciones (recargable)
  const { grades, refresh: refreshGrades } = useGrades(isNaN(numericId) ? null : numericId);

  useEffect(() => {
    if (isNaN(numericId)) {
      console.error('❌ Invalid student ID:', studentId);
      setError('ID de estudiante inválido');
      setLoading(false);
      return;
    }
    console.log('🔍 Loading student profile for ID:', numericId);
    loadStudentData(numericId);
  }, [numericId]);

  const loadStudentData = async (numericId) => {
    try {
      setLoading(true);

      // Cargar información del estudiante desde Drupal
      console.log('📥 Fetching student from Drupal...');
      console.log('   Endpoint:', `${import.meta.env.VITE_API_URL}/api/students/${numericId}`);
      
      let studentData = null;
      try {
        studentData = await studentService.getById(numericId);
        console.log('✅ Student loaded:', studentData);
      } catch (studentError) {
        console.warn('⚠️ Could not load student, will continue with grades:', studentError.message);
      }

      // Si no encontramos el estudiante pero tenemos calificaciones, continuamos
      if (!studentData) {
        console.log('⚠️ No student data, but checking for grades...');
      } else {
        setStudent(studentData);

        // Cargar curso del estudiante
        console.log('📚 Fetching course:', studentData.courseId);
        if (studentData.courseId) {
          try {
            const coursesData = await courseService.getAll();
            const studentCourse = coursesData.find(c => c.id === studentData.courseId);
            console.log('✅ Course loaded:', studentCourse);
            setCourse(studentCourse);

            // Cargar materias del curso
            console.log('📝 Fetching subjects for course:', studentData.courseId);
            const subjectsData = await subjectService.getAll();
            const courseSubjects = subjectsData.filter(s => s.courseId === studentData.courseId);
            console.log('✅ Subjects loaded:', courseSubjects.length);
            setSubjects(courseSubjects);
          } catch (courseError) {
            console.warn('⚠️ Error loading course/subjects:', courseError.message);
          }
        }
      }

      // Cargar asistencias del estudiante
      try {
        console.log('📅 Fetching attendance for student:', numericId);
        const attendanceData = await attendanceService.getByStudent(numericId);
        console.log('✅ Attendance loaded:', attendanceData.length);
        setAttendance(attendanceData);
      } catch (attendanceError) {
        console.warn('⚠️ Error loading attendance:', attendanceError.message);
      }

      // Cargar notas del estudiante
      try {
        console.log('📝 Fetching notes for student:', numericId);
        const notesData = await noteService.getByStudent(numericId);
        console.log('✅ Notes loaded:', notesData.length);
        setNotes(notesData || []);
      } catch (notesError) {
        console.warn('⚠️ Error loading notes:', notesError.message);
      }

      // Si tenemos al menos calificaciones, es OK
      if (!studentData) {
        console.warn('⚠️ Warning: Loading with limited data (only grades available)');
      }

      setError(null);
    } catch (err) {
      console.error('❌ Critical error loading student data:', err);
      console.error('   Status:', err.response?.status);
      console.error('   Data:', err.response?.data);
      console.error('   Message:', err.message);
      setError('Error al cargar datos: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getGradesBySubject = (subjectId) => {
    return grades.filter(g => g.subjectId === subjectId);
  };

  const getAttendanceStats = () => {
    if (!attendance || attendance.length === 0) {
      return {
        present: 0,
        absent: 0,
        halfAbsent: 0,
        total: 0
      };
    }
    return {
      present: attendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length,
      absent: attendance.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length,
      halfAbsent: attendance.filter(a => a.status === ATTENDANCE_STATUS.HALF_ABSENT).length,
      total: attendance.length
    };
  };

  const getAbsentAndHalfAbsentDays = () => {
    const absentDays = [];
    const halfAbsentDays = [];

    if (!attendance || attendance.length === 0) {
      return { absentDays, halfAbsentDays };
    }

    attendance.forEach(record => {
      if (record.status === ATTENDANCE_STATUS.ABSENT) {
        absentDays.push({
          date: record.date,
          formattedDate: new Date(record.date + 'T00:00:00').toLocaleDateString('es', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      } else if (record.status === ATTENDANCE_STATUS.HALF_ABSENT) {
        halfAbsentDays.push({
          date: record.date,
          formattedDate: new Date(record.date + 'T00:00:00').toLocaleDateString('es', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      }
    });

    // Ordenar por fecha descendente
    absentDays.sort((a, b) => new Date(b.date) - new Date(a.date));
    halfAbsentDays.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { absentDays, halfAbsentDays };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-2xl">⏳ Cargando datos del estudiante...</div>
      </div>
    );
  }

  if (error && !student && grades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
            <h2 className="text-2xl font-bold mb-2">❌ {error || 'Estudiante no encontrado'}</h2>
            <div className="space-y-2 text-sm">
              <p>ID solicitado: <code className="bg-red-100 px-2 py-1 rounded">{studentId}</code></p>
              {!student && (
                <>
                  <p>El estudiante con ID <strong>{studentId}</strong> no existe en la base de datos.</p>
                  <p className="mt-4 font-semibold">💡 Opciones:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Verifica que el ID sea correcto</li>
                    <li>Verifica que el estudiante exista en Drupal</li>
                  </ul>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // Si tenemos calificaciones pero no datos del estudiante, mostrar vista limitada
  if (!student && grades.length > 0) {
    // Obtener información de las calificaciones
    const allSubjects = new Set(grades.map(g => g.subjectId));
    const gradesBySubject = {};
    
    grades.forEach(grade => {
      if (!gradesBySubject[grade.subjectId]) {
        gradesBySubject[grade.subjectId] = [];
      }
      gradesBySubject[grade.subjectId].push(grade);
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors"
            >
              <span className="text-xl">←</span> Volver
            </button>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={refreshGrades}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                title="Recargar calificaciones"
              >
                🔄 Actualizar
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>

          {/* Information Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2">
                  Estudiante #{studentId}
                </h1>
                <p className="text-slate-500 font-medium">Registros disponibles: {grades.length} calificaciones</p>
              </div>
              <div className="text-left sm:text-right">
                <div className="inline-block bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg">
                  <div className="text-sm font-semibold opacity-90">Total de Calificaciones</div>
                  <div className="text-3xl font-bold">{grades.length}</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <p className="font-semibold text-sm">⚠️ Información limitada</p>
              <p className="text-sm mt-1">Se están mostrando solo las calificaciones registradas. Los datos personales del estudiante no están disponibles.</p>
            </div>
          </div>

          {/* Subjects and Grades */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
              📚 Calificaciones por Materia
            </h2>

            <div className="space-y-4">
              {Array.from(allSubjects).map(subjectId => {
                const subjectGrades = gradesBySubject[subjectId];
                const average = subjectGrades.length > 0
                  ? (subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length).toFixed(2)
                  : null;

                const getAverageColor = (avg) => {
                  if (!avg) return 'text-slate-400';
                  if (avg >= 7) return 'text-emerald-600';
                  if (avg >= 4) return 'text-amber-600';
                  return 'text-rose-600';
                };

                const getAverageBg = (avg) => {
                  if (!avg) return 'bg-slate-100 border-slate-200';
                  if (avg >= 7) return 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-300';
                  if (avg >= 4) return 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-300';
                  return 'bg-gradient-to-br from-rose-100 to-pink-100 border-rose-300';
                };

                return (
                  <div key={subjectId} className="border-2 border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-indigo-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-slate-800">Materia ID: {subjectId}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {subjectGrades.length} {subjectGrades.length === 1 ? 'calificación' : 'calificaciones'}
                        </p>
                      </div>
                      <div className={`${getAverageBg(average)} border-2 px-5 py-3 rounded-xl text-center min-w-[90px] shadow-sm`}>
                        <div className="text-xs text-slate-600 font-bold uppercase tracking-wide">Promedio</div>
                        <div className={`text-3xl font-bold ${getAverageColor(average)} mt-1`}>
                          {average || 'S/N'}
                        </div>
                      </div>
                    </div>

                    {subjectGrades.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {subjectGrades.map(grade => (
                          <div
                            key={grade.id}
                            className="bg-slate-50 px-4 py-3 rounded-lg border-2 border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-slate-800">
                                {grade.grade}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                {new Date(grade.date).toLocaleDateString('es', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-sm bg-slate-50 p-4 rounded-lg text-center">
                        Sin calificaciones registradas
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            <p className="font-semibold">📊 Resumen</p>
            <p className="text-sm mt-1">Total de calificaciones: <strong>{grades.length}</strong> | Materias: <strong>{allSubjects.size}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  const stats = getAttendanceStats();
  const attendancePercentage = stats.total > 0
    ? ((stats.present + (stats.halfAbsent * 0.5)) / stats.total * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors"
          >
            <span className="text-xl">←</span> Volver
          </button>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={refreshGrades}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
              title="Recargar calificaciones"
            >
              🔄 Actualizar
            </button>
            <button
              onClick={() => window.print()}
              className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
            >
              🖨️ Imprimir
            </button>
          </div>
        </div>

        {/* Información Personal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-slate-500 font-medium">Legajo #{student.legajo || student.id}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="inline-block bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg">
                <div className="text-sm font-semibold opacity-90">Curso</div>
                <div className="text-3xl font-bold">{course?.name || 'N/A'}</div>
                <div className="text-sm opacity-90">{course?.shift || ''}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1 font-medium">📧 Email del Padre/Tutor</p>
              <p className="font-semibold text-slate-800">{student.email}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1 font-medium">📅 Año que Cursa</p>
              <p className="font-semibold text-slate-800">
                {course?.name?.charAt(0) || 'N/A'}° Año
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1 font-medium">🕐 Turno</p>
              <p className="font-semibold text-slate-800">{course?.shift || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Estadísticas de Asistencia */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
            📊 Asistencias
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl font-bold text-emerald-600">{stats.present}</div>
              <div className="text-sm text-emerald-700 font-semibold mt-1">Presentes</div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl font-bold text-rose-600">{stats.absent}</div>
              <div className="text-sm text-rose-700 font-semibold mt-1">Ausentes</div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl font-bold text-amber-600">{stats.halfAbsent}</div>
              <div className="text-sm text-amber-700 font-semibold mt-1">Media Falta</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl font-bold text-blue-600">{attendancePercentage}%</div>
              <div className="text-sm text-blue-700 font-semibold mt-1">Asistencia</div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-500 flex items-center justify-end pr-3"
              style={{ width: `${attendancePercentage}%` }}
            >
              <span className="text-white text-xs font-bold">{attendancePercentage}%</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-3 text-center font-medium">
            Total de días registrados: {stats.total}
          </p>

          {/* Detalle de Faltas y Medias Faltas */}
          {(() => {
            const { absentDays, halfAbsentDays } = getAbsentAndHalfAbsentDays();
            return (
              <>
                {(absentDays.length > 0 || halfAbsentDays.length > 0) && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">📍 Detalle de Ausencias</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Ausencias Completas */}
                      {absentDays.length > 0 && (
                        <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-5">
                          <h4 className="font-bold text-rose-700 mb-4 flex items-center gap-2">
                            <span className="text-xl">🔴</span> Faltas Completas ({absentDays.length})
                          </h4>
                          <div className="space-y-2 max-h-72 overflow-y-auto">
                            {absentDays.map((day, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-rose-200 text-sm">
                                <p className="text-rose-700 font-semibold capitalize">{day.formattedDate}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medias Faltas */}
                      {halfAbsentDays.length > 0 && (
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
                          <h4 className="font-bold text-amber-700 mb-4 flex items-center gap-2">
                            <span className="text-xl">🟠</span> Medias Faltas ({halfAbsentDays.length})
                          </h4>
                          <div className="space-y-2 max-h-72 overflow-y-auto">
                            {halfAbsentDays.map((day, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-amber-200 text-sm">
                                <p className="text-amber-700 font-semibold capitalize">{day.formattedDate}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Notas de los Profesores */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
            📝 Notas de los Profesores
          </h2>

          {notes.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No hay notas registradas para este estudiante
            </p>
          ) : (
            <div className="space-y-4">
              {notes.map((note, idx) => (
                <div 
                  key={note.id || idx} 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3">
                    <div>
                      <h4 className="font-bold text-blue-900 text-lg">{note.title || note.field_title_note}</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        👨‍🏫 {note.authorName || 'Profesor desconocido'}
                      </p>
                    </div>
                    <div className="text-sm text-blue-600 font-semibold whitespace-nowrap">
                      {note.date ? new Date(note.date).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Sin fecha'}
                    </div>
                  </div>
                  <p className="text-blue-800 leading-relaxed whitespace-pre-wrap break-words">
                    {note.content || note.field_content_note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Materias y Notas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
            📚 Materias y Calificaciones
          </h2>

          {subjects.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No hay materias asignadas a este curso
            </p>
          ) : (
            <div className="space-y-4">
              {subjects.map(subject => {
                const subjectGrades = getGradesBySubject(subject.id);
                const average = subjectGrades.length > 0
                  ? (subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length).toFixed(2)
                  : null;

                const getAverageColor = (avg) => {
                  if (!avg) return 'text-slate-400';
                  if (avg >= 7) return 'text-emerald-600';
                  if (avg >= 4) return 'text-amber-600';
                  return 'text-rose-600';
                };

                const getAverageBg = (avg) => {
                  if (!avg) return 'bg-slate-100 border-slate-200';
                  if (avg >= 7) return 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-300';
                  if (avg >= 4) return 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-300';
                  return 'bg-gradient-to-br from-rose-100 to-pink-100 border-rose-300';
                };

                return (
                  <div key={subject.id} className="border-2 border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-indigo-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-slate-800">{subject.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {subjectGrades.length} {subjectGrades.length === 1 ? 'calificación' : 'calificaciones'}
                        </p>
                      </div>
                      <div className={`${getAverageBg(average)} border-2 px-5 py-3 rounded-xl text-center min-w-[90px] shadow-sm`}>
                        <div className="text-xs text-slate-600 font-bold uppercase tracking-wide">Promedio</div>
                        <div className={`text-3xl font-bold ${getAverageColor(average)} mt-1`}>
                          {average || 'S/N'}
                        </div>
                      </div>
                    </div>

                    {subjectGrades.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {subjectGrades.map(grade => (
                          <div
                            key={grade.id}
                            className="bg-slate-50 px-4 py-3 rounded-lg border-2 border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-slate-800">
                                {grade.grade}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                {new Date(grade.date).toLocaleDateString('es', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-sm bg-slate-50 p-4 rounded-lg text-center">
                        Sin calificaciones registradas
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen General */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg p-5 sm:p-8 mt-6 text-white">
          <h2 className="text-2xl font-bold mb-6">📈 Resumen General</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <p className="text-white/80 text-sm font-medium mb-1">Materias Cursando</p>
              <p className="text-4xl font-bold">{subjects.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <p className="text-white/80 text-sm font-medium mb-1">Promedio General</p>
              <p className="text-4xl font-bold">
                {subjects.length > 0
                  ? (subjects.reduce((sum, subject) => {
                    const grades = getGradesBySubject(subject.id);
                    if (grades.length === 0) return sum;
                    return sum + (grades.reduce((s, g) => s + g.grade, 0) / grades.length);
                  }, 0) / subjects.filter(s => getGradesBySubject(s.id).length > 0).length).toFixed(2)
                  : 'S/N'
                }
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <p className="text-white/80 text-sm font-medium mb-1">% Asistencia</p>
              <p className="text-4xl font-bold">{attendancePercentage}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
