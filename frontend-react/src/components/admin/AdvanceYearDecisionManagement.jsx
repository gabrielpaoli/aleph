// components/admin/AdvanceYearDecisionManagement.jsx

import React, { useEffect, useState } from 'react';
import { advanceYearDecisionService, courseService, studentService } from '../../services/api';

const ACTION_COLUMNS = [
  { value: 'cursando', label: 'Cursando', color: 'border-slate-300 bg-slate-50' },
  { value: 'promote', label: 'Pasa de ano', color: 'border-emerald-300 bg-emerald-50' },
  { value: 'retain', label: 'Repite', color: 'border-amber-300 bg-amber-50' },
  { value: 'graduate', label: 'Egreso', color: 'border-violet-300 bg-violet-50' },
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
  const [closing, setClosing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeConfirmText, setCloseConfirmText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const progressTimerRef = React.useRef(null);

  useEffect(() => {
    loadCourses();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        progressTimerRef.current.cancel();
        progressTimerRef.current = null;
      }
    };
  }, []);

  // Warn user if they try to close/refresh the page while progress modal is open
  useEffect(() => {
    const beforeUnloadHandler = (e) => {
      if (!showProgressModal) return;
      const message = 'El proceso de cierre está en curso. No cierre ni actualice el navegador hasta que termine.';
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    if (showProgressModal) {
      window.addEventListener('beforeunload', beforeUnloadHandler);
    }
    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [showProgressModal]);

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
            action: 'cursando',
            nextCourseId: '',
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
    return decisions[studentId] || { action: 'cursando', nextCourseId: '' };
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

  const handleMoveAll = (actionValue) => {
    const defaultNextCourseId = actionValue === 'promote'
      ? getNextCourseIdFor(Number(selectedCourseId))
      : '';
    const nextDecisions = {};
    students.forEach((student) => {
      nextDecisions[student.id] = {
        action: actionValue,
        nextCourseId: actionValue === 'promote' ? defaultNextCourseId : '',
      };
    });
    setDecisions(nextDecisions);
    const label = actionValue === 'promote' ? 'Pasa de ano' : (actionValue === 'retain' ? 'Repite' : (actionValue === 'graduate' ? 'Egreso' : 'Cursando'));
    setSuccess(`Todos los estudiantes marcados como ${label}`);
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

  const handleCloseYear = async () => {
    const hasCursando = students.some(
      (student) => getDecisionForStudent(student.id).action === 'cursando'
    );
    if (hasCursando) {
      setError('No se puede cerrar el ano lectivo si hay estudiantes en Cursando');
      return;
    }

    try {
      setClosing(true);
      setError('');
      setSuccess('');

      // Start job on server
      const resp = await advanceYearDecisionService.closeAcademicYear(academicYear);
      const jobId = resp?.jobId;
      if (!jobId) {
        setError('No se pudo iniciar el proceso de cierre');
        setClosing(false);
        return;
      }

      setProgressPercent(0);
      setProgressMessage('Iniciando cierre del año lectivo...');
      setShowCloseModal(false);
      setShowProgressModal(true);

      // Sequential polling – each poll triggers backend work AND waits for the
      // response before scheduling the next poll to avoid double-processing.
      let cancelled = false;
      progressTimerRef.current = { cancel: () => { cancelled = true; } };

      const poll = async () => {
        if (cancelled) return;
        try {
          const status = await advanceYearDecisionService.getJobStatus(jobId);
          if (cancelled || !status) return;

          const total = Number(status.total) || 0;
          const processed = Number(status.processed) || 0;
          const percent = total > 0 ? Math.round((processed / total) * 100) : (status.status === 'finished' ? 100 : 0);
          setProgressPercent(percent);
          setProgressMessage(status.message || (status.status === 'running' ? 'Procesando estudiantes...' : 'Finalizado'));

          if (status.status === 'finished') {
            progressTimerRef.current = null;
            setProgressPercent(100);
            setProgressMessage('Cierre finalizado. Aplicando cambios...');
            setTimeout(async () => {
              setShowProgressModal(false);
              setShowCloseModal(false);
              setCloseConfirmText('');
              setSuccess('Ano lectivo cerrado correctamente');
              if (selectedCourseId) {
                await loadCourseData(selectedCourseId, academicYear);
              }
              setClosing(false);
            }, 800);
            return;
          }

          if (status.status === 'error') {
            progressTimerRef.current = null;
            setShowProgressModal(false);
            setError(status.message || 'Error durante el cierre del ano');
            setClosing(false);
            return;
          }

          // Schedule next poll after a short delay (sequential, not interval).
          setTimeout(poll, 300);
        } catch (e) {
          console.error('Error polling job status', e);
          if (!cancelled) setTimeout(poll, 1000);
        }
      };

      // Kick off the first poll immediately.
      poll();
    } catch (err) {
      console.error('Error closing academic year:', err);
      if (progressTimerRef.current) {
        progressTimerRef.current.cancel();
        progressTimerRef.current = null;
      }
      setProgressPercent(0);
      setShowProgressModal(false);
      const apiError = err?.response?.data?.error || err?.message || 'No se pudo cerrar el ano lectivo';
      setError(apiError);
    } finally {
      // setClosing managed in polling completion
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
  const hasCursando = students.some(
    (student) => getDecisionForStudent(student.id).action === 'cursando'
  );

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">📌 Promocion de Estudiantes</h2>

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="w-full">
              <button
                onClick={handleSave}
                disabled={saving || students.length === 0}
                className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar decisiones'}
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <div className="w-full">
              <button
                onClick={() => setShowCloseModal(true)}
                disabled={closing || hasCursando}
                className="w-full px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {closing ? 'Cerrando...' : 'Cerrar el ano lectivo'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-rose-600 font-medium">{error}</div>
        )}
        {hasCursando && !error && (
          <div className="mt-4 text-amber-600 font-medium">
            Para cerrar el ano lectivo, todos los estudiantes deben salir de Cursando.
          </div>
        )}
        {success && (
          <div className="mt-4 text-emerald-600 font-medium">{success}</div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-700">{column.label}</h3>
                  <button
                    onClick={() => handleMoveAll(column.value)}
                    disabled={students.length === 0}
                    className="text-sm px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pasar todos
                  </button>
                </div>
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

      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Confirmar cierre del ano lectivo
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Esta accion elimina todas las faltas, notas y registros asociados a cada estudiante.
              Tambien actualiza el curso segun la promocion y elimina estudiantes egresados.
            </p>
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg p-3 mb-4">
              Para continuar, escribe CERRAR en el campo de abajo.
            </div>
            <input
              type="text"
              value={closeConfirmText}
              onChange={(e) => setCloseConfirmText(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4"
              placeholder="Escribe CERRAR"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setCloseConfirmText('');
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseYear}
                disabled={closing || closeConfirmText !== 'CERRAR'}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {closing ? 'Cerrando...' : 'Confirmar cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showProgressModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Cierre del año lectivo</h3>
            <p className="text-sm text-slate-600 mb-4">{progressMessage}</p>

            <div className="mb-3">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-2">
                <strong>Atención:</strong> No cerrar ni actualizar el navegador hasta que finalice el proceso.
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <div>{progressPercent}%</div>
              <div>{closing ? 'En progreso' : ''}</div>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => {
                  if (!closing) setShowProgressModal(false);
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                disabled={closing}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceYearDecisionManagement;
