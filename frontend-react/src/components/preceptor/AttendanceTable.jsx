// components/preceptor/AttendanceTable.jsx (versión mejorada)

import React, { useState } from 'react';
import { dummyData, ATTENDANCE_STATUS } from '../../services/dummyData';
import { useStudents } from '../../hooks/useStudents';
import { useAttendance } from '../../hooks/useAttendance';

const AttendanceTable = () => {
  const currentYear = 2026;
  const currentMonth = new Date().getMonth();

  const [selectedCourse, setSelectedCourse] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hasChanges, setHasChanges] = useState(false);

  const { students, loading: loadingStudents } = useStudents(selectedCourse);
  const {
    attendance,
    loading: loadingAttendance,
    updateAttendance,
    bulkUpdateAttendance
  } = useAttendance(selectedCourse, selectedYear, selectedMonth);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const [localChanges, setLocalChanges] = useState({});

  const handleAttendanceChange = (studentId, day, status) => {
    const date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    setLocalChanges(prev => ({
      ...prev,
      [`${studentId}-${date}`]: { studentId, date, status }
    }));

    setHasChanges(true);
  };

  const handleSave = async () => {
    const changes = Object.values(localChanges);
    if (changes.length > 0) {
      await bulkUpdateAttendance(changes);
      setLocalChanges({});
      setHasChanges(false);
      alert('Asistencias guardadas correctamente');
    }
  };

  const handleCancel = () => {
    setLocalChanges({});
    setHasChanges(false);
  };

  const getAttendanceStatus = (studentId, day) => {
    const date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const key = `${studentId}-${date}`;

    if (localChanges[key]) {
      return localChanges[key].status;
    }

    const existing = attendance.find(
      a => a.studentId === studentId && a.date === date
    );

    return existing?.status || '';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT:
        return 'bg-green-100';
      case ATTENDANCE_STATUS.ABSENT:
        return 'bg-red-100';
      case ATTENDANCE_STATUS.HALF_ABSENT:
        return 'bg-yellow-100';
      default:
        return 'bg-white';
    }
  };

  const getMonthStats = (studentId) => {
    const stats = {
      present: 0,
      absent: 0,
      halfAbsent: 0
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const status = getAttendanceStatus(studentId, day);
      if (status === ATTENDANCE_STATUS.PRESENT) stats.present++;
      if (status === ATTENDANCE_STATUS.ABSENT) stats.absent++;
      if (status === ATTENDANCE_STATUS.HALF_ABSENT) stats.halfAbsent++;
    }

    return stats;
  };

  if (loadingStudents || loadingAttendance) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {dummyData.courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name} - {course.shift}
            </option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(2024, i).toLocaleString('es', { month: 'long' })}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border-2 border-slate-200 p-2 rounded-lg focus:border-indigo-500 focus:outline-none"
        >
          {[2026, 2027, 2028].map(year => ( // ← Cambiar aquí
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {hasChanges && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Guardar Cambios
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full border-collapse border bg-white">
          <thead className="bg-gray-200">
          <tr>
            <th className="border p-2 sticky left-0 bg-gray-200 z-10 min-w-[150px]">
              Estudiante
            </th>
            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = new Date(selectedYear, selectedMonth, i + 1);
              const dayName = date.toLocaleDateString('es', { weekday: 'short' });
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <th
                  key={i}
                  className={`border p-1 text-xs ${isWeekend ? 'bg-gray-300' : ''}`}
                >
                  <div>{i + 1}</div>
                  <div className="text-[10px] text-gray-600">{dayName}</div>
                </th>
              );
            })}
            <th className="border p-2 bg-gray-200 sticky right-0 z-10">
              Resumen
            </th>
          </tr>
          </thead>
          <tbody>
          {students.map(student => {
            const stats = getMonthStats(student.id);

            return (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="border p-2 sticky left-0 bg-white font-medium z-10">
                  {student.lastName}, {student.firstName}
                </td>
                {Array.from({ length: daysInMonth }, (_, day) => {
                  const date = new Date(selectedYear, selectedMonth, day + 1);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const status = getAttendanceStatus(student.id, day + 1);

                  return (
                    <td
                      key={day}
                      className={`border p-0 ${isWeekend ? 'bg-gray-100' : getStatusColor(status)}`}
                    >
                      {!isWeekend && (
                        <select
                          value={status}
                          onChange={(e) => handleAttendanceChange(student.id, day + 1, e.target.value)}
                          className="w-full text-xs p-1 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-</option>
                          <option value={ATTENDANCE_STATUS.PRESENT}>P</option>
                          <option value={ATTENDANCE_STATUS.ABSENT}>A</option>
                          <option value={ATTENDANCE_STATUS.HALF_ABSENT}>½</option>
                        </select>
                      )}
                    </td>
                  );
                })}
                <td className="border p-2 sticky right-0 bg-white text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-green-600">P: {stats.present}</span>
                    <span className="text-red-600">A: {stats.absent}</span>
                    <span className="text-yellow-600">½: {stats.halfAbsent}</span>
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Leyenda:</h3>
        <div className="flex gap-4 text-sm">
          <span><strong>P:</strong> Presente</span>
          <span><strong>A:</strong> Ausente</span>
          <span><strong>½:</strong> Media Falta</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTable;
