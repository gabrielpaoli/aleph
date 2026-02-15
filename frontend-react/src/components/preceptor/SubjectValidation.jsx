// components/preceptor/SubjectValidation.jsx

import React, { useEffect, useState } from 'react';
import { courseService, studentService, subjectService, subjectEnrollmentService } from '../../services/api';

const STATUS_COLUMNS = [
  { value: 'cursando', label: 'Cursando', color: 'border-slate-300 bg-slate-50' },
  { value: 'aprobada', label: 'Aprobada', color: 'border-emerald-300 bg-emerald-50' },
  { value: 'desaprobada', label: 'Desaprobada', color: 'border-rose-300 bg-rose-50' },
  { value: 'recuperatorio_diciembre', label: 'Recup. Diciembre', color: 'border-amber-300 bg-amber-50' },
  { value: 'recuperatorio_febrero', label: 'Recup. Febrero', color: 'border-orange-300 bg-orange-50' },
];

const SubjectValidation = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseData(selectedCourseId, academicYear);
    }
  }, [selectedCourseId, academicYear]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getAll();
      const sorted = Array.isArray(data) ? data : [];
      setCourses(sorted);
      if (sorted.length > 0) {
        setSelectedCourseId(String(sorted[0].id));
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('No se pudieron cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseData = async (courseIdValue, year) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const courseId = Number(courseIdValue);
      const [studentsData, subjectsData, enrollmentsData] = await Promise.all([
        studentService.getAll(),
        subjectService.getAll(),
        subjectEnrollmentService.getByCourse(courseId, year),
      ]);

      const courseStudents = (studentsData || []).filter((s) => s.courseId === courseId);
      const courseSubjects = (subjectsData || []).filter((s) => s.courseId === courseId);

      setStudents(courseStudents);
      setSubjects(courseSubjects);

      const nextStatusMap = {};
      (enrollmentsData || []).forEach((item) => {
        const key = `${item.studentId}_${item.subjectId}`;
        nextStatusMap[key] = item.status;
      });
      setStatusMap(nextStatusMap);
    } catch (err) {
      console.error('Error loading course data:', err);
      setError('No se pudieron cargar los datos del curso');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, subjectId, value) => {
    const key = `${studentId}_${subjectId}`;
    setStatusMap((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDragStart = (studentId, subjectId) => {
    setDraggedItem({ studentId, subjectId });
  };

  const handleDrop = (studentId, statusValue) => {
    if (!draggedItem || draggedItem.studentId !== studentId) {
      return;
    }
    handleStatusChange(studentId, draggedItem.subjectId, statusValue);
    setDraggedItem(null);
  };

  const getStatusFor = (studentId, subjectId) => {
    const key = `${studentId}_${subjectId}`;
    return statusMap[key] || 'cursando';
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const items = [];
      students.forEach((student) => {
        subjects.forEach((subject) => {
          const key = `${student.id}_${subject.id}`;
          const status = statusMap[key] || 'cursando';
          items.push({
            studentId: student.id,
            subjectId: subject.id,
            academicYear,
            status,
          });
        });
      });

      await subjectEnrollmentService.upsert(items);
      setSuccess('Validaciones guardadas correctamente');
    } catch (err) {
      console.error('Error saving enrollments:', err);
      setError('No se pudieron guardar las validaciones');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAll = () => {
    const nextStatusMap = {};
    students.forEach((student) => {
      subjects.forEach((subject) => {
        const key = `${student.id}_${subject.id}`;
        nextStatusMap[key] = 'aprobada';
      });
    });
    setStatusMap(nextStatusMap);
    setSuccess('Todas las materias marcadas como aprobadas');
  };

  const handleApproveAllForStudent = (studentId) => {
    setStatusMap((prev) => {
      const next = { ...prev };
      subjects.forEach((subject) => {
        const key = `${studentId}_${subject.id}`;
        next[key] = 'aprobada';
      });
      return next;
    });
    setSuccess('Materias del estudiante marcadas como aprobadas');
  };

  const getStudentName = (student) => `${student.firstName} ${student.lastName}`;

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">✅ Validar Materias</h2>

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Curso</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} - {course.shift}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Ano Academico</label>
            <input
              type="number"
              value={academicYear}
              onChange={(e) => setAcademicYear(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              min="2000"
              max="2100"
            />
          </div>

          <div className="flex items-end">
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleApproveAll}
                disabled={students.length === 0 || subjects.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aprobar todas
              </button>
              <button
                onClick={handleSave}
                disabled={saving || students.length === 0 || subjects.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar Validaciones'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500">Cargando...</div>
      ) : (
        <div className="space-y-6">
          {students.length === 0 && (
            <div className="p-6 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
              No hay estudiantes en este curso
            </div>
          )}

          {students.map((student) => (
            <div key={student.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{getStudentName(student)}</h3>
                  <p className="text-sm text-slate-500">Legajo: {student.legajo || 'N/A'}</p>
                </div>
                <button
                  onClick={() => handleApproveAllForStudent(student.id)}
                  className="px-3 py-2 text-sm bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
                >
                  Aprobar todas
                </button>
              </div>

              {subjects.length === 0 ? (
                <p className="text-slate-500">No hay materias asignadas al curso</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-w-[900px]">
                    {STATUS_COLUMNS.map((column) => (
                      <div
                        key={column.value}
                        className={`border rounded-lg p-3 min-h-[120px] ${column.color}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(student.id, column.value)}
                      >
                        <div className="text-sm font-bold text-slate-700 mb-2">
                          {column.label}
                        </div>
                        <div className="space-y-2">
                          {subjects
                            .filter((subject) => getStatusFor(student.id, subject.id) === column.value)
                            .map((subject) => (
                              <div
                                key={subject.id}
                                draggable
                                onDragStart={() => handleDragStart(student.id, subject.id)}
                                className="bg-white border border-slate-200 rounded-md px-2 py-2 text-sm shadow-sm cursor-move"
                              >
                                {subject.name}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectValidation;
