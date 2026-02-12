// components/preceptor/AbsenceNotification.jsx

import React, { useState, useEffect } from 'react';
import { dummyData, ATTENDANCE_STATUS } from '../../services/dummyData';
import { attendanceService, studentService, courseService } from '../../services/api';

const AbsenceNotification = () => {
  const [selectedDate, setSelectedDate] = useState('2026-03-15');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [sending, setSending] = useState(false);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAbsentStudents();
  }, [selectedDate, selectedCourse, students]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [studentsData, coursesData] = await Promise.all([
        studentService.getAll(),
        courseService.getAll()
      ]);

      setStudents(studentsData);
      setCourses(coursesData);
    } catch (err) {
      console.error('❌ Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAbsentStudents = async () => {
    if (students.length === 0) return;

    try {
      const attendance = await attendanceService.getByDate(selectedDate);

      const absent = attendance
        .filter(a => a.status === ATTENDANCE_STATUS.ABSENT)
        .map(a => {
          const student = students.find(s => s.id === a.studentId);
          const course = courses.find(c => c.id === student?.courseId);
          return {
            ...student,
            course,
            attendanceId: a.id
          };
        })
        .filter(s => s && (selectedCourse === 'all' || s.courseId === Number(selectedCourse)));

      setAbsentStudents(absent);
      setSelectedStudents(absent.map(s => s.id));
    } catch (err) {
      console.error('❌ Error loading absences:', err);
    }
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleToggleAll = () => {
    if (selectedStudents.length === absentStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(absentStudents.map(s => s.id));
    }
  };

  const handleSendEmails = async () => {
    if (selectedStudents.length === 0) {
      alert('Seleccione al menos un estudiante');
      return;
    }

    if (!confirm(`¿Enviar emails a ${selectedStudents.length} padres?`)) {
      return;
    }

    setSending(true);

    try {
      await attendanceService.sendAbsenceEmails(selectedDate, selectedStudents);
      alert(`Emails enviados exitosamente a ${selectedStudents.length} padres`);
    } catch (error) {
      console.error('❌ Error sending emails:', error);
      alert('Error al enviar emails: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  // Función helper para formatear fechas sin problemas de zona horaria
  const formatDateLocal = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formato corto para el asunto (sin día de la semana)
  const formatDateShort = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getEmailPreview = () => {
    const formattedDate = formatDateLocal(selectedDate);

    return `Estimado padre/madre:

Le informamos que su hijo/a ha registrado una ausencia el día ${formattedDate}.

Por favor, justifique la inasistencia a la brevedad.

Saludos cordiales,
Equipo de Preceptoría`;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-xl">⏳ Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-slate-800">📧 Notificar Ausencias</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold text-slate-700">📅 Fecha:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-slate-700">📚 Filtrar por curso:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Todos los cursos</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} - {course.shift}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-xl text-slate-800">
              👥 Estudiantes Ausentes ({absentStudents.length})
            </h3>
            {absentStudents.length > 0 && (
              <button
                onClick={handleToggleAll}
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                {selectedStudents.length === absentStudents.length ? '❌ Deseleccionar' : '✅ Seleccionar'} todos
              </button>
            )}
          </div>

          {absentStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-slate-500 text-lg font-medium">
                No hay ausentes en esta fecha
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto mb-4 border rounded-lg">
                <table className="w-full">
                  <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left p-3 w-12"></th>
                    <th className="text-left p-3 font-semibold">Estudiante</th>
                    <th className="text-left p-3 font-semibold">Curso</th>
                  </tr>
                  </thead>
                  <tbody>
                  {absentStudents.map(student => (
                    <tr key={student.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleToggleStudent(student.id)}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-semibold text-slate-800">
                            {student.lastName}, {student.firstName}
                          </div>
                          <div className="text-xs text-slate-500">
                            📧 {student.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                            {student.course?.name || 'Sin curso'}
                          </span>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleSendEmails}
                disabled={sending || selectedStudents.length === 0}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {sending
                  ? '⏳ Enviando...'
                  : `📧 Enviar Emails (${selectedStudents.length} seleccionados)`
                }
              </button>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-xl mb-4 text-slate-800">📄 Vista Previa del Email</h3>
          <div className="bg-slate-50 p-6 rounded-lg border-2 border-slate-200">
            <div className="mb-4 pb-4 border-b border-slate-300">
              <strong className="text-slate-700">Asunto:</strong>
              <p className="text-slate-600 mt-1">
                Notificación de Ausencia - {formatDateShort(selectedDate)}
              </p>
            </div>
            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
              {getEmailPreview()}
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Nota:</strong> Los emails se enviarán a las direcciones registradas de los padres.
              Asegúrese de verificar que las direcciones sean correctas antes de enviar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsenceNotification;
