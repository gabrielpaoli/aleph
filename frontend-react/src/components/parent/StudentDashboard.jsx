// components/parent/StudentDashboard.jsx

import React from 'react';
import { dummyData, ATTENDANCE_STATUS } from '../../services/dummyData';

const StudentDashboard = ({ studentId }) => {
  const student = dummyData.students.find(s => s.id === studentId);
  const course = dummyData.courses.find(c => c.id === student?.courseId);
  const subjects = dummyData.subjects.filter(s => s.courseId === student?.courseId);

  const getGradesBySubject = (subjectId) => {
    return dummyData.grades.filter(g => g.studentId === studentId && g.subjectId === subjectId);
  };

  const getAttendanceStats = () => {
    const attendance = dummyData.attendance.filter(a => a.studentId === studentId);
    return {
      present: attendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length,
      absent: attendance.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length,
      halfAbsent: attendance.filter(a => a.status === ATTENDANCE_STATUS.HALF_ABSENT).length
    };
  };

  const stats = getAttendanceStats();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Información del Estudiante</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Nombre:</p>
            <p className="font-semibold">{student.firstName} {student.lastName}</p>
          </div>
          <div>
            <p className="text-gray-600">Email:</p>
            <p className="font-semibold">{student.email}</p>
          </div>
          <div>
            <p className="text-gray-600">Curso:</p>
            <p className="font-semibold">{course?.name} - {course?.shift}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Asistencias</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-100 rounded">
            <p className="text-3xl font-bold text-green-700">{stats.present}</p>
            <p className="text-gray-600">Presentes</p>
          </div>
          <div className="text-center p-4 bg-red-100 rounded">
            <p className="text-3xl font-bold text-red-700">{stats.absent}</p>
            <p className="text-gray-600">Ausentes</p>
          </div>
          <div className="text-center p-4 bg-yellow-100 rounded">
            <p className="text-3xl font-bold text-yellow-700">{stats.halfAbsent}</p>
            <p className="text-gray-600">Media Falta</p>          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6">
        <h3 className="text-xl font-bold mb-4">Notas por Materia</h3>
        <div className="space-y-4">
          {subjects.map(subject => {
            const grades = getGradesBySubject(subject.id);
            const average = grades.length > 0
              ? (grades.reduce((sum, g) => sum + g.grade, 0) / grades.length).toFixed(2)
              : 'N/A';

            return (
              <div key={subject.id} className="border rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-lg">{subject.name}</h4>
                  <span className="text-xl font-bold text-blue-600">
                    Promedio: {average}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {grades.length > 0 ? (
                    grades.map(grade => (
                      <div key={grade.id} className="bg-gray-100 px-3 py-1 rounded">
                        <span className="font-semibold">{grade.grade}</span>
                        <span className="text-xs text-gray-600 ml-2">
                          {new Date(grade.date).toLocaleDateString('es')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Sin notas registradas</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
