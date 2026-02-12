// components/student/StudentProfile.jsx (versión con colores mejorados)

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dummyData, ATTENDANCE_STATUS } from '../../services/dummyData';

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const student = dummyData.students.find(s => s.id === parseInt(studentId));

  if (!student) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl text-red-500">Estudiante no encontrado</h2>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
        >
          Volver
        </button>
      </div>
    );
  }

  const course = dummyData.courses.find(c => c.id === student.courseId);
  const subjects = dummyData.subjects.filter(s => s.courseId === student.courseId);

  const getGradesBySubject = (subjectId) => {
    return dummyData.grades.filter(g => g.studentId === student.id && g.subjectId === subjectId);
  };

  const getAttendanceStats = () => {
    const attendance = dummyData.attendance.filter(a => a.studentId === student.id);
    return {
      present: attendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length,
      absent: attendance.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length,
      halfAbsent: attendance.filter(a => a.status === ATTENDANCE_STATUS.HALF_ABSENT).length,
      total: attendance.length
    };
  };

  const stats = getAttendanceStats();
  const attendancePercentage = stats.total > 0
    ? ((stats.present + (stats.halfAbsent * 0.5)) / stats.total * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors"
          >
            <span className="text-xl">←</span> Volver
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
          >
            🖨️ Imprimir
          </button>
        </div>

        {/* Información Personal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-slate-500 font-medium">Legajo #{student.id}</p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg">
                <div className="text-sm font-semibold opacity-90">Curso</div>
                <div className="text-3xl font-bold">{course?.name}</div>
                <div className="text-sm opacity-90">{course?.shift}</div>
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
                {course?.name?.charAt(0)}° Año
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1 font-medium">🕐 Turno</p>
              <p className="font-semibold text-slate-800">{course?.shift}</p>
            </div>
          </div>
        </div>

        {/* Estadísticas de Asistencia */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
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

          {/* Barra de progreso mejorada */}
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
        </div>

        {/* Materias y Notas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
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
                const grades = getGradesBySubject(subject.id);
                const average = grades.length > 0
                  ? (grades.reduce((sum, g) => sum + g.grade, 0) / grades.length).toFixed(2)
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
                          {grades.length} {grades.length === 1 ? 'calificación' : 'calificaciones'}
                        </p>
                      </div>
                      <div className={`${getAverageBg(average)} border-2 px-5 py-3 rounded-xl text-center min-w-[90px] shadow-sm`}>
                        <div className="text-xs text-slate-600 font-bold uppercase tracking-wide">Promedio</div>
                        <div className={`text-3xl font-bold ${getAverageColor(average)} mt-1`}>
                          {average || 'S/N'}
                        </div>
                      </div>
                    </div>

                    {grades.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {grades.map(grade => (
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
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg p-8 mt-6 text-white">
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
