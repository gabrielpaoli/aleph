// components/preceptor/AbsenceNotification.jsx (versión mejorada)

import React, { useState, useEffect } from 'react';
import { dummyData, ATTENDANCE_STATUS } from '../../services/dummyData';
import { attendanceService, notificationService } from '../../services/api';

const AbsenceNotification = () => {
  const [selectedDate, setSelectedDate] = useState('2026-03-15');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [sending, setSending] = useState(false);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    loadAbsentStudents();
  }, [selectedDate, selectedCourse]);

  const loadAbsentStudents = async () => {
    const attendance = await attendanceService.getByDate(selectedDate);

    const absent = attendance
      .filter(a => a.status === ATTENDANCE_STATUS.ABSENT)
      .map(a => {
        const student = dummyData.students.find(s => s.id === a.studentId);
        const course = dummyData.courses.find(c => c.id === student?.courseId);
        return { ...student, course, attendanceId: a.id };
      })
      .filter(s => selectedCourse === 'all' || s.courseId === Number(selectedCourse));

    setAbsentStudents(absent);
    setSelectedStudents(absent.map(s => s.id));
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
      await notificationService.sendAbsenceEmails(selectedDate, selectedStudents);
      alert(`Emails enviados exitosamente a ${selectedStudents.length} padres`);
    } catch (error) {
      alert('Error al enviar emails: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const getEmailPreview = () => {
    const date = new Date(selectedDate).toLocaleDateString('es', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
Estimado padre/madre:

Le informamos que su hijo/a ha registrado una ausencia el día ${date}.

Por favor, justifique la inasistencia a la brevedad.

Saludos cordiales,
Equipo de Preceptoría
    `.trim();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Notificar Ausencias</h2>

      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-semibold">Fecha:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Filtrar por curso:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="all">Todos los cursos</option>
              {dummyData.courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} - {course.shift}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">
              Estudiantes Ausentes ({absentStudents.length})
            </h3>
            {absentStudents.length > 0 && (
              <button
                onClick={handleToggleAll}
                className="text-sm text-blue-600 hover:underline"
              >
                {selectedStudents.length === absentStudents.length ? 'Deseleccionar' : 'Seleccionar'} todos
              </button>
            )}
          </div>

          {absentStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay ausentes en esta fecha
            </p>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto mb-4">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left p-2 w-10"></th>
                    <th className="text-left p-2">Estudiante</th>
                    <th className="text-left p-2">Curso</th>
                  </tr>
                  </thead>
                  <tbody>
                  {absentStudents.map(student => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleToggleStudent(student.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">
                            {student.lastName}, {student.firstName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {student.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-sm">
                        {student.course?.name}
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleSendEmails}
                disabled={sending || selectedStudents.length === 0}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {sending
                  ? 'Enviando...'
                  : `Enviar Emails (${selectedStudents.length} seleccionados)`
                }
              </button>
            </>
          )}
        </div>

        <div className="bg-white rounded shadow p-6">
          <h3 className="font-bold text-lg mb-4">Vista Previa del Email</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="mb-4">
              <strong>Asunto:</strong> Notificación de Ausencia - {new Date(selectedDate).toLocaleDateString('es')}
            </div>
            <div className="whitespace-pre-wrap text-sm">              {getEmailPreview()}
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Los emails se enviarán a las direcciones registradas de los padres.
              Asegúrese de verificar que las direcciones sean correctas antes de enviar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsenceNotification;
