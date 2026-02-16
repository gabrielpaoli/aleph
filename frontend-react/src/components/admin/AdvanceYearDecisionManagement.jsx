// components/admin/AdvanceYearDecisionManagement.jsx

import React, { useEffect, useState } from 'react';
import { advanceYearDecisionService, courseService, studentService } from '../../services/api';

const ACTION_COLUMNS = [
  { value: 'promote', label: 'Pasa de ano', color: 'border-emerald-300 bg-emerald-50' },
  { value: 'retain', label: 'Repite', color: 'border-amber-300 bg-amber-50' },
  { value: 'graduate', label: 'Egreso', color: 'border-slate-300 bg-slate-50' },
];

const AdvanceYearDecisionManagement = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [students, setStudents] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [draggedStudentId, setDraggedStudentId] = useState(null);
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
      const [studentsData, decisionsData] = await Promise.all([
        studentService.getAll(),
        advanceYearDecisionService.getByCourse(courseId, year),
      ]);

      const courseStudents = (studentsData || []).filter((s) => s.courseId === courseId);
      setStudents(courseStudents);

      const nextDecisions = {};
      const defaultNextCourseId = getNextCourseIdFor(courseId);
      (decisionsData || []).forEach((item) => {
        nextDecisions[item.studentId] = {
          action: item.action,
          nextCourseId: item.nextCourseId || '',
        };
      });
      courseStudents.forEach((student) => {
        if (!nextDecisions[student.id]) {
          nextDecisions[student.id] = {
            action: 'promote',
            nextCourseId: defaultNextCourseId,
          };
        } else if (nextDecisions[student.id].action === 'promote' && !nextDecisions[student.id].nextCourseId) {
          nextDecisions[student.id].nextCourseId = defaultNextCourseId;
        }
      });
      setDecisions(nextDecisions);
    } catch (err) {
      console.error('Error loading advance decisions:', err);
      setError('No se pudieron cargar las decisiones');
    } finally {
      setLoading(false);
    }
  };

  const getDecisionForStudent = (studentId) => {
    return decisions[studentId] || { action: 'promote', nextCourseId: '' };
  };

  const setDecision = (studentId, patch) => {
    setDecisions((prev) => ({
      ...prev,
      [studentId]: {
        ...getDecisionForStudent(studentId),
        ...patch,
      },
    }));
  };

  const handleDragStart = (studentId) => {
    setDraggedStudentId(studentId);
  };

  const handleDrop = (actionValue) => {
    if (!draggedStudentId) return;
    const defaultNextCourseId = actionValue === 'promote'
      ? getNextCourseIdFor(Number(selectedCourseId))
      : '';
    setDecision(draggedStudentId, {
      action: actionValue,
      nextCourseId: actionValue === 'promote'
        ? (getDecisionForStudent(draggedStudentId).nextCourseId || defaultNextCourseId)
        : '',
    });
    setDraggedStudentId(null);
  };

  const handleSelectNextCourse = (studentId, value) => {
    setDecision(studentId, { nextCourseId: value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const items = students.map((student) => {
        const decision = getDecisionForStudent(student.id);
        return {
          studentId: student.id,
          currentCourseId: Number(selectedCourseId),
          nextCourseId: decision.action === 'promote' ? Number(decision.nextCourseId) || null : null,
          academicYear,
          action: decision.action,
        };
      });

      const missingNextCourse = items.find(
        (item) => item.action === 'promote' && !item.nextCourseId
      );
      if (missingNextCourse) {
        setError('Selecciona el curso destino para los estudiantes que pasan de ano');
        return;
      }

      await advanceYearDecisionService.upsert(items);
      setSuccess('Decisiones guardadas correctamente');
    } catch (err) {
      console.error('Error saving decisions:', err);
      setError('No se pudieron guardar las decisiones');
    } finally {
      setSaving(false);
    }
  };

  const getStudentName = (student) => `${student.firstName} ${student.lastName}`;

  const getNextCourseIdFor = (currentCourseId) => {
    const currentCourse = courses.find((course) => course.id === currentCourseId);
    if (!currentCourse || !currentCourse.name) return '';

    const compactName = String(currentCourse.name).replace(/\s+/g, '');
    const match = compactName.match(/^(\d+)([A-Za-z]+)?$/);
    if (!match) return '';

    const nextName = `${Number(match[1]) + 1}${match[2] || ''}`;
    const nextCourse = courses.find((course) => {
      if (course.name !== nextName) return false;
      if (currentCourse.shift && course.shift) {
        return course.shift === currentCourse.shift;
      }
      return true;
    });

    return nextCourse ? String(nextCourse.id) : '';
  };

  const nextCourseOptions = courses.filter((course) => String(course.id) !== String(selectedCourseId));

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">📌 Promocion de Estudiantes</h2>

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
            <button
              onClick={handleSave}
              disabled={saving || students.length === 0}
              className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar decisiones'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-rose-600 font-medium">{error}</div>
        )}
        {success && (
          <div className="mt-4 text-emerald-600 font-medium">{success}</div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ACTION_COLUMNS.map((column) => {
            const columnStudents = students.filter(
              (student) => getDecisionForStudent(student.id).action === column.value
            );

            return (
              <div
                key={column.value}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(column.value)}
                className={`rounded-xl border-2 ${column.color} p-4 min-h-[300px]`}
              >
                <h3 className="text-lg font-bold text-slate-700 mb-3">{column.label}</h3>
                {columnStudents.length === 0 ? (
                  <div className="text-sm text-slate-500">Arrastra estudiantes aqui</div>
                ) : (
                  <div className="space-y-3">
                    {columnStudents.map((student) => {
                      const decision = getDecisionForStudent(student.id);

                      return (
                        <div
                          key={student.id}
                          draggable
                          onDragStart={() => handleDragStart(student.id)}
                          className="bg-white rounded-lg border border-slate-200 px-4 py-3 shadow-sm cursor-move"
                        >
                          <div className="font-semibold text-slate-800">{getStudentName(student)}</div>
                          <div className="text-xs text-slate-500">ID: {student.id}</div>

                          {decision.action === 'promote' && (
                            <div className="mt-3">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Curso destino
                              </label>
                              <select
                                value={decision.nextCourseId}
                                onChange={(e) => handleSelectNextCourse(student.id, e.target.value)}
                                className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm"
                              >
                                <option value="">Seleccionar curso</option>
                                {nextCourseOptions.map((course) => (
                                  <option key={course.id} value={course.id}>
                                    {course.name} - {course.shift}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdvanceYearDecisionManagement;
