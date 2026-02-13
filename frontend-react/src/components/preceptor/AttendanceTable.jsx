// components/preceptor/AttendanceTable.jsx

import React, { useState, useEffect } from 'react';
import { ATTENDANCE_STATUS } from '../../services/dummyData';
import { studentService, courseService, attendanceService, subjectService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AttendanceTable = () => {
  const { user } = useAuth();
  const isTeacher = user && user.role === 'docente';
  
  const currentYear = 2026;
  const currentMonth = new Date().getMonth();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hasChanges, setHasChanges] = useState(false);

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [yearAttendance, setYearAttendance] = useState([]);
  const [allYearsAttendance, setAllYearsAttendance] = useState({}); // Por curso
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [localChanges, setLocalChanges] = useState({});

  // Cargar cursos al montar o cuando cambia el usuario
  useEffect(() => {
    loadCourses();
  }, [user, isTeacher]);

  // Cargar estadísticas anuales cuando los cursos se cargan o cambia el año
  useEffect(() => {
    if (courses.length > 0) {
      loadAllCoursesYearAttendance();
    }
  }, [courses, selectedYear]);

  // Cargar estudiantes cuando cambia el curso
  useEffect(() => {
    if (selectedCourse) {
      loadStudents();
    }
  }, [selectedCourse]);

  // Cargar asistencias cuando cambia curso, mes o año
  useEffect(() => {
    if (selectedCourse) {
      loadAttendance();
    }
  }, [selectedCourse, selectedMonth, selectedYear]);

  // Cargar asistencias anuales cuando cambia curso o año
  useEffect(() => {
    if (selectedCourse) {
      loadYearAttendance();
    }
  }, [selectedCourse, selectedYear]);

  const loadCourses = async () => {
    try {
      console.log('📚 Loading courses...');
      setLoading(true);

      const coursesData = await courseService.getAll();

      console.log('✅ Courses loaded:', coursesData.length);
      console.log('   Courses:', coursesData);

      // Si es docente, filtrar solo sus cursos (basado en sus materias)
      let filteredCourses = coursesData;
      if (isTeacher && user?.subjectIds?.length > 0) {
        console.log('👨‍🏫 Teacher detected. Filtering courses...');
        
        // Cargar materias del docente
        const allSubjects = await subjectService.getAll();
        const teacherSubjects = allSubjects.filter(s =>
          user.subjectIds.includes(s.id)
        );
        
        // Obtener cursos únicos del docente
        const teacherCourseIds = new Set();
        teacherSubjects.forEach(subject => {
          if (subject.courseId) {
            teacherCourseIds.add(subject.courseId);
          }
        });
        
        filteredCourses = coursesData.filter(c =>
          teacherCourseIds.has(c.id)
        );
        console.log('✅ Teacher courses filtered:', filteredCourses.length, 'de', coursesData.length);
      }

      setCourses(filteredCourses);

      // Seleccionar el primer curso por defecto
      if (filteredCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(filteredCourses[0].id);
        console.log('   Selected first course:', filteredCourses[0].id);
      }

      setError(null);
    } catch (err) {
      console.error('❌ Error loading courses:', err);
      setError('Error al cargar cursos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      console.log('👨‍🎓 Loading students for course:', selectedCourse);
      setLoading(true);

      const studentsData = await studentService.getAll();
      const filtered = studentsData.filter(s => s.courseId === selectedCourse);

      console.log('✅ Students loaded:', filtered.length);
      console.log('   All students:', studentsData.length);
      console.log('   Filtered for course', selectedCourse, ':', filtered.length);
      console.log('   Students:', filtered);

      setStudents(filtered);
      setError(null);
    } catch (err) {
      console.error('❌ Error loading students:', err);
      setError('Error al cargar estudiantes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      console.log('📅 Loading attendance for:', {
        courseId: selectedCourse,
        year: selectedYear,
        month: selectedMonth
      });

      setLoading(true);
      const attendanceData = await attendanceService.getByCourseAndMonth(
        selectedCourse,
        selectedYear,
        selectedMonth
      );

      console.log('✅ Attendance loaded:', attendanceData.length, 'records');
      setAttendance(attendanceData);
      setError(null);
    } catch (err) {
      console.error('❌ Error loading attendance:', err);
      setError('Error al cargar asistencias: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadYearAttendance = async () => {
    try {
      console.log('📅 Loading full year attendance for:', {
        courseId: selectedCourse,
        year: selectedYear
      });

      const yearData = await attendanceService.getByCourseAndYear(
        selectedCourse,
        selectedYear
      );

      console.log('✅ Year attendance loaded:', yearData.length, 'records');
      setYearAttendance(yearData);
    } catch (err) {
      console.error('❌ Error loading year attendance:', err);
    }
  };

  const loadAllCoursesYearAttendance = async () => {
    try {
      console.log('📚 Loading full year attendance for all courses...');
      const courseStats = {};

      for (const course of courses) {
        try {
          const yearData = await attendanceService.getByCourseAndYear(
            course.id,
            selectedYear
          );
          courseStats[course.id] = yearData;
        } catch (err) {
          console.error(`Error loading attendance for course ${course.id}:`, err);
          courseStats[course.id] = [];
        }
      }

      console.log('✅ All courses year attendance loaded');
      setAllYearsAttendance(courseStats);
    } catch (err) {
      console.error('❌ Error loading all courses attendance:', err);
    }
  };

  const getStatsForCourse = (courseId) => {
    const stats = {
      totalPresent: 0,
      totalAbsent: 0,
      totalHalfAbsent: 0
    };

    const courseData = allYearsAttendance[courseId] || [];
    courseData.forEach(record => {
      if (record.status === ATTENDANCE_STATUS.PRESENT) stats.totalPresent++;
      if (record.status === ATTENDANCE_STATUS.ABSENT) stats.totalAbsent++;
      if (record.status === ATTENDANCE_STATUS.HALF_ABSENT) stats.totalHalfAbsent++;
    });

    return stats;
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

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
      try {
        console.log('💾 Saving changes:', changes.length);
        await attendanceService.bulkUpdate(changes);
        setLocalChanges({});
        setHasChanges(false);
        await loadAttendance();
        alert('Asistencias guardadas correctamente');
      } catch (err) {
        console.error('❌ Error saving:', err);
        alert('Error al guardar: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setLocalChanges({});
    setHasChanges(false);
  };

  const handleCourseChange = (courseId) => {
    console.log('🔄 Changing course to:', courseId);
    setSelectedCourse(Number(courseId));
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
        return 'bg-emerald-100';
      case ATTENDANCE_STATUS.ABSENT:
        return 'bg-rose-100';
      case ATTENDANCE_STATUS.HALF_ABSENT:
        return 'bg-amber-100';
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

  const getYearStats = () => {
    const yearStats = {
      totalPresent: 0,
      totalAbsent: 0,
      totalHalfAbsent: 0
    };

    // Usar los datos de asistencia anual cargados
    yearAttendance.forEach(record => {
      if (record.status === ATTENDANCE_STATUS.PRESENT) yearStats.totalPresent++;
      if (record.status === ATTENDANCE_STATUS.ABSENT) yearStats.totalAbsent++;
      if (record.status === ATTENDANCE_STATUS.HALF_ABSENT) yearStats.totalHalfAbsent++;
    });

    return yearStats;
  };

  if (loading && courses.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-xl">⏳ Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          No hay cursos disponibles. Por favor, crea cursos y estudiantes primero.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-full mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-slate-800">📋 Control de Asistencias</h2>

        {/* Alerta para docentes */}
        {isTeacher && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg text-blue-800">
            <p className="font-semibold">👨‍🏫 Modo Docente: Solo ves los cursos donde enseñas</p>
            <p className="text-sm mt-1">Estás viendo {courses.length} de {courses.length} curso(s) asignado(s)</p>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 flex gap-4 items-center flex-wrap bg-white p-4 rounded-xl shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Curso:</label>
            <select
              value={selectedCourse || ''}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="border-2 border-slate-200 p-2 rounded-lg focus:border-indigo-500 focus:outline-none min-w-[200px]"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} - {course.shift}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mes:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border-2 border-slate-200 p-2 rounded-lg focus:border-indigo-500 focus:outline-none min-w-[150px]"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2024, i).toLocaleString('es', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Año:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border-2 border-slate-200 p-2 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              {[2026, 2027, 2028].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {hasChanges && (
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleSave}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all font-semibold shadow-md"
              >
                💾 Guardar Cambios
              </button>
              <button
                onClick={handleCancel}
                className="bg-slate-500 text-white px-6 py-2 rounded-lg hover:bg-slate-600 transition-colors font-semibold"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Resumen anual por curso */}
        {courses.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border-l-4 border-indigo-500">
            <h3 className="font-semibold text-slate-800 mb-4">📊 Resumen Anual {selectedYear} - Por Curso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => {
                const stats = getStatsForCourse(course.id);
                return (
                  <div key={course.id} className={`p-4 rounded-lg border-2 transition-all ${selectedCourse === course.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
                    <h4 className="font-semibold text-slate-800 mb-3 text-center">{course.name} - {course.shift}</h4>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center p-2 bg-emerald-100 rounded">
                        <span className="text-sm font-medium text-emerald-800">Presentes:</span>
                        <span className="text-lg font-bold text-emerald-700">{stats.totalPresent}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-rose-100 rounded">
                        <span className="text-sm font-medium text-rose-800">Faltas:</span>
                        <span className="text-lg font-bold text-rose-700">{stats.totalAbsent}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-amber-100 rounded">
                        <span className="text-sm font-medium text-amber-800">Media Falta:</span>
                        <span className="text-lg font-bold text-amber-700">{stats.totalHalfAbsent}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {students.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-slate-500 text-lg">
              No hay estudiantes en este curso
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-xl bg-white">
            <table className="min-w-full border-collapse">
              <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <tr>
                <th className="border p-3 sticky left-0 bg-indigo-600 z-10 min-w-[180px]">
                  Estudiante
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const date = new Date(selectedYear, selectedMonth, i + 1);
                  const dayName = date.toLocaleDateString('es', { weekday: 'short' });
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <th
                      key={i}
                      className={`border p-2 text-xs ${isWeekend ? 'bg-indigo-700' : ''}`}
                    >
                      <div className="font-bold">{i + 1}</div>
                      <div className="text-[10px] opacity-90">{dayName}</div>
                    </th>
                  );
                })}
                <th className="border p-3 bg-indigo-600 sticky right-0 z-10 min-w-[120px]">
                  Resumen
                </th>
              </tr>
              </thead>
              <tbody>
              {students.map(student => {
                const stats = getMonthStats(student.id);

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="border p-3 sticky left-0 bg-white font-semibold z-10 text-slate-800">
                      {student.lastName}, {student.firstName}
                    </td>
                    {Array.from({ length: daysInMonth }, (_, day) => {
                      const date = new Date(selectedYear, selectedMonth, day + 1);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const status = getAttendanceStatus(student.id, day + 1);

                      return (
                        <td
                          key={day}
                          className={`border p-0 ${isWeekend ? 'bg-slate-100' : getStatusColor(status)}`}
                        >
                          {!isWeekend && (
                            <select
                              value={status}
                              onChange={(e) => handleAttendanceChange(student.id, day + 1, e.target.value)}
                              className="w-full text-xs p-2 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                        <span className="text-emerald-600 font-semibold">P: {stats.present}</span>
                        <span className="text-rose-600 font-semibold">A: {stats.absent}</span>
                        <span className="text-amber-600 font-semibold">½: {stats.halfAbsent}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}

        {/* Leyenda */}
        <div className="mt-6 p-4 bg-white rounded-xl shadow-sm">
          <h3 className="font-semibold mb-3 text-slate-800">📖 Leyenda:</h3>
          <div className="flex gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 border-2 border-emerald-300 rounded flex items-center justify-center font-bold">P</div>
              <span>Presente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-100 border-2 border-rose-300 rounded flex items-center justify-center font-bold">A</div>
              <span>Ausente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 border-2 border-amber-300 rounded flex items-center justify-center font-bold">½</div>
              <span>Media Falta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTable;
