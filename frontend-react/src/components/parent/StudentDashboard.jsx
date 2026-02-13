// components/parent/StudentDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ATTENDANCE_STATUS } from '../../services/dummyData';
import { studentService, courseService, subjectService, attendanceService } from '../../services/api';
import { useGrades } from '../../hooks/useGrades';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = ({ studentId: initialStudentId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Estado para manejar múltiples estudiantes del padre
  const [currentStudentId, setCurrentStudentId] = useState(initialStudentId);
  const [parentStudents, setParentStudents] = useState([]);
  const [parentStudentDetails, setParentStudentDetails] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(true);
  
  // Proteger acceso: asegurarse que el padre solo vea sus estudiantes
  useEffect(() => {
    console.log('🔄 useEffect triggered. User:', user);
    if (user && user.role === 'parent') {
      console.log('👨‍👩‍👧 Parent detected, loading students...');
      loadParentStudents();
    }
  }, [user]);

  const loadParentStudents = async () => {
    try {
      setLoadingStudents(true);
      console.log('👨‍👩‍👧‍👦 Loading parent students. User data:', {
        studentId: user.studentId,
        studentIds: user.studentIds,
        role: user.role
      });
      
      if (user.studentIds && user.studentIds.length > 0) {
        console.log('✅ Found', user.studentIds.length, 'students for parent');
        setParentStudents(user.studentIds);
        
        // Cargar detalles de cada estudiante
        const details = {};
        for (const sid of user.studentIds) {
          try {
            const studentData = await studentService.getById(sid);
            details[sid] = studentData;
            console.log(`✅ Loaded student ${sid}:`, studentData.firstName, studentData.lastName);
          } catch (err) {
            console.error('Error loading student', sid, err);
          }
        }
        setParentStudentDetails(details);
        console.log('📊 Parent students loaded:', {
          parentStudentsCount: user.studentIds.length,
          parentStudents: user.studentIds,
          parentStudentDetails: Object.keys(details),
          showSelector: user.studentIds.length > 1
        });
        
        // Usar el primero como actual (sin depender de currentStudentId)
        setCurrentStudentId(user.studentIds[0]);
      } else if (user.studentId) {
        // Fallback para la estructura antigua
        console.log('📦 Using fallback studentId:', user.studentId);
        setParentStudents([user.studentId]);
        setCurrentStudentId(user.studentId);
        try {
          const studentData = await studentService.getById(user.studentId);
          setParentStudentDetails({ [user.studentId]: studentData });
        } catch (err) {
          console.error('Error loading student', user.studentId, err);
        }
      } else {
        console.warn('⚠️ No studentIds or studentId found in user data');
      }
    } catch (err) {
      console.error('Error loading parent students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const [student, setStudent] = useState(null);
  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Usar hook personalizado para calificaciones
  const { grades } = useGrades(currentStudentId);

  useEffect(() => {
    loadStudentData(currentStudentId);
  }, [currentStudentId]);

  const loadStudentData = async (id) => {
    try {
      setLoading(true);
      console.log('📥 Cargando información del estudiante:', id);

      // Cargar información del estudiante
      const studentData = await studentService.getById(id);
      console.log('✅ Estudiante cargado:', studentData);
      setStudent(studentData);

      // Cargar curso del estudiante
      if (studentData?.courseId) {
        const coursesData = await courseService.getAll();
        const studentCourse = coursesData.find(c => c.id === studentData.courseId);
        console.log('✅ Curso cargado:', studentCourse);
        setCourse(studentCourse);

        // Cargar materias del curso
        const subjectsData = await subjectService.getAll();
        const courseSubjects = subjectsData.filter(s => s.courseId === studentData.courseId);
        console.log('✅ Materias cargadas:', courseSubjects.length);
        setSubjects(courseSubjects);
      }

      // Cargar asistencias del estudiante
      const attendanceData = await attendanceService.getByStudent(id);
      console.log('✅ Asistencias cargadas:', attendanceData.length);
      setAttendance(attendanceData);

      setError(null);
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError('Error al cargar los datos del estudiante');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    if (!attendance || attendance.length === 0) {
      return { present: 0, absent: 0, halfAbsent: 0 };
    }
    return {
      present: attendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length,
      absent: attendance.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length,
      halfAbsent: attendance.filter(a => a.status === ATTENDANCE_STATUS.HALF_ABSENT).length
    };
  };

  const getGradesBySubject = (subjectId) => {
    return grades.filter(g => g.subjectId === subjectId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-slate-600 font-semibold">Cargando información del estudiante...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">❌ Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = getAttendanceStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Selector de Estudiantes si hay múltiples */}
        {parentStudents.length > 1 && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              👨‍👩‍👧‍👦 Seleccionar Estudiante:
            </label>
            <div className="flex gap-2 flex-wrap">
              {parentStudents.map((sid) => {
                const studentData = parentStudentDetails[sid];
                const name = studentData 
                  ? `${studentData.firstName} ${studentData.lastName}` 
                  : `Estudiante ${sid}`;
                
                return (
                  <button
                    key={sid}
                    onClick={() => setCurrentStudentId(sid)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      currentStudentId === sid
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Información del Estudiante */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-slate-800">👨‍🎓 {student?.firstName} {student?.lastName}</h1>
            <span className="text-sm font-semibold bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
              {course?.name} - {course?.shift}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-slate-600 text-sm">📧 Email</p>
              <p className="font-semibold text-slate-900">{student?.email}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm">🏫 Curso</p>
              <p className="font-semibold text-slate-900">{course?.name}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm">🕐 Turno</p>
              <p className="font-semibold text-slate-900">{course?.shift}</p>
            </div>
          </div>
        </div>

        {/* Estadísticas de Asistencia */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">📅 Asistencias</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6 text-center">
              <p className="text-4xl font-bold text-green-700 mb-2">{stats.present}</p>
              <p className="text-green-700 font-semibold">Presentes</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-6 text-center">
              <p className="text-4xl font-bold text-red-700 mb-2">{stats.absent}</p>
              <p className="text-red-700 font-semibold">Ausentes</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-4xl font-bold text-yellow-700 mb-2">{stats.halfAbsent}</p>
              <p className="text-yellow-700 font-semibold">Media Falta</p>
            </div>
          </div>
        </div>

        {/* Calificaciones por Materia */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">📊 Notas por Materia</h2>
          {subjects.length === 0 ? (
            <p className="text-slate-600">No hay materias asignadas</p>
          ) : (
            <div className="space-y-4">
              {subjects.map(subject => {
                const subjectGrades = getGradesBySubject(subject.id);
                const average = subjectGrades.length > 0
                  ? (subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length).toFixed(2)
                  : 'N/A';

                return (
                  <div key={subject.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-slate-800">{subject.name}</h3>
                      <span className="text-2xl font-bold text-blue-600">
                        {average === 'N/A' ? 'N/A' : `${average}/10`}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {subjectGrades.length > 0 ? (
                        subjectGrades.map(grade => (
                          <div key={grade.id} className="bg-slate-100 px-3 py-2 rounded-lg">
                            <span className="font-semibold text-slate-700">{grade.grade}</span>
                            <span className="text-xs text-slate-600 ml-2">
                              {new Date(grade.date).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 text-sm">Sin notas registradas</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
