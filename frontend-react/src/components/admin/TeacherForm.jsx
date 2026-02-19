// components/admin/TeacherForm.jsx

import React, { useState, useEffect } from 'react';
import { dummyData } from '../../services/dummyData';
import { teacherService, courseService, subjectService } from '../../services/api';

const TeacherForm = () => {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [teachers, setTeachers] = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [subjects, setSubjects] = useState([]);

  // ── Form ──────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ firstName: '', apellido: '', email: '', subjectIds: [] });
  const [editingId, setEditingId] = useState(null);
  const [formCourseFilter, setFormCourseFilter] = useState('');

  // ── Filters ───────────────────────────────────────────────────────────────
  const [nameQuery,        setNameQuery]        = useState('');
  const [suggestions,      setSuggestions]      = useState([]);
  const [showSuggestions,  setShowSuggestions]  = useState(false);
  const [filterCourse,     setFilterCourse]     = useState('');
  const [filterSubject,    setFilterSubject]    = useState('');

  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    Promise.all([
      teacherService.getAll().catch(() => []),
      courseService.getAll().catch(() => dummyData.courses),
      subjectService.getAll().catch(() => dummyData.subjects),
    ]).then(([tData, cData, sData]) => {
      if (!mounted) return;
      setTeachers((Array.isArray(tData) ? tData : []).map(t => ({
        id:         t.id,
        firstName:  t.firstName  || '',
        apellido:   t.apellido   || '',
        email:      t.email      || '',
        subjectIds: t.subjectIds || [],
      })));
      setCourses(Array.isArray(cData) ? cData : (cData?.courses ?? dummyData.courses));
      setSubjects(Array.isArray(sData) ? sData : (sData?.subjects ?? dummyData.subjects));
    });
    return () => { mounted = false; };
  }, []);

  // ── Derived maps ──────────────────────────────────────────────────────────
  const subjectsById  = Object.fromEntries(subjects.map(s => [s.id, s]));
  const coursesById   = Object.fromEntries(courses.map(c => [c.id, c]));

  // subjects visible en el dropdown de filtro según curso seleccionado
  const filteredSubjectOptions = filterCourse
    ? subjects.filter(s => String(s.courseId) === String(filterCourse))
    : subjects;

  // ── Filtered + paginated teachers ─────────────────────────────────────────
  const filteredTeachers = teachers.filter(t => {
    const fullName = `${t.firstName || ''} ${t.apellido || ''}`.toLowerCase();
    if (nameQuery.trim() && !fullName.includes(nameQuery.toLowerCase())) return false;
    if (filterCourse) {
      const courseSubjectIds = subjects
        .filter(s => String(s.courseId) === String(filterCourse))
        .map(s => s.id);
      if (!t.subjectIds.some(id => courseSubjectIds.includes(id))) return false;
    }
    if (filterSubject && !t.subjectIds.includes(Number(filterSubject))) return false;
    return true;
  });

  const pageCount    = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  const pageTeachers = filteredTeachers.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  // ── Name autocomplete ─────────────────────────────────────────────────────
  const handleNameQuery = (val) => {
    setNameQuery(val);
    setCurrentPage(0);
    if (!val.trim()) { setSuggestions([]); return; }
    const q = val.toLowerCase();
    setSuggestions(
      teachers
        .filter(t => `${t.firstName || ''} ${t.apellido || ''}`.toLowerCase().includes(q))
        .slice(0, 6)
        .map(t => ({ id: t.id, label: [t.firstName, t.apellido].filter(Boolean).join(' ') }))
    );
  };

  const clearFilters = () => {
    setNameQuery(''); setSuggestions([]);
    setFilterCourse(''); setFilterSubject('');
    setCurrentPage(0);
  };

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await teacherService.update(editingId, formData);
        setTeachers(teachers.map(t => t.id === editingId ? { ...formData, id: editingId } : t));
        setEditingId(null);
      } else {
        const created = await teacherService.create(formData);
        setTeachers(prev => [...prev, {
          id:         created.id || Date.now(),
          firstName:  formData.firstName,
          apellido:   formData.apellido,
          email:      formData.email,
          subjectIds: formData.subjectIds,
        }]);
      }
    } catch (err) {
      console.error('Error guardando docente:', err);
      alert('Error al guardar el docente. Revisá la consola.');
    }
    setFormData({ firstName: '', apellido: '', email: '', subjectIds: [] });
    setFormCourseFilter('');
  };

  const handleEdit = (t) => { setFormData(t); setEditingId(t.id); setFormCourseFilter(''); };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar docente?')) setTeachers(teachers.filter(t => t.id !== id));
  };

  const handleSubjectToggle = (subjectId) =>
    setFormData(prev => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter(id => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }));

  // subjects visibles en el formulario según formCourseFilter
  const formSubjects = formCourseFilter
    ? subjects.filter(s => String(s.courseId) === String(formCourseFilter))
    : subjects;

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Formulario ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" placeholder="Nombre" value={formData.firstName} required
            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full border p-2 rounded" />
          <input type="text" placeholder="Apellido" value={formData.apellido}
            onChange={e => setFormData({ ...formData, apellido: e.target.value })}
            className="w-full border p-2 rounded" />
        </div>
        <input type="email" placeholder="Email" value={formData.email} required
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className="w-full border p-2 rounded" />

        <div className="border p-3 rounded">
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="font-semibold text-sm">Materias que dicta:</p>
            <select value={formCourseFilter} onChange={e => setFormCourseFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1 max-w-[200px]">
              <option value="">Todos los cursos</option>
              {courses.map(c => <option key={c.id} value={String(c.id)}>{c.name} ({c.shift})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-44 overflow-y-auto pr-1">
            {formSubjects.map(s => (
              <label key={s.id} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                <input type="checkbox" className="shrink-0"
                  checked={formData.subjectIds.includes(s.id)}
                  onChange={() => handleSubjectToggle(s.id)} />
                <span className="truncate" title={`${s.name} (${coursesById[s.courseId]?.name})`}>
                  {s.name} <span className="text-slate-400">({coursesById[s.courseId]?.name})</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          {editingId ? 'Actualizar' : 'Agregar'} Docente
        </button>
      </form>

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Nombre predictivo */}
        <div className="relative">
          <input type="text" placeholder="🔍 Buscar por nombre…"
            value={nameQuery}
            onChange={e => handleNameQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full border p-2 rounded text-sm" />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 bg-white border rounded mt-1 max-h-40 overflow-auto shadow-md">
              {suggestions.map(s => (
                <li key={s.id} className="p-2 text-sm hover:bg-slate-100 cursor-pointer"
                  onMouseDown={() => { setNameQuery(s.label); setSuggestions([]); setCurrentPage(0); }}>
                  {s.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Curso */}
        <select value={filterCourse}
          onChange={e => { setFilterCourse(e.target.value); setFilterSubject(''); setCurrentPage(0); }}
          className="w-full border p-2 rounded text-sm">
          <option value="">Todos los cursos</option>
          {courses.map(c => <option key={c.id} value={String(c.id)}>{c.name} ({c.shift})</option>)}
        </select>

        {/* Materia */}
        <select value={filterSubject}
          onChange={e => { setFilterSubject(e.target.value); setCurrentPage(0); }}
          className="w-full border p-2 rounded text-sm">
          <option value="">Todas las materias</option>
          {filteredSubjectOptions.map(s => (
            <option key={s.id} value={String(s.id)}>
              {s.name}{filterCourse ? '' : ` (${coursesById[s.courseId]?.name})`}
            </option>
          ))}
        </select>
      </div>

      {/* Contador + limpiar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500">{filteredTeachers.length} docente{filteredTeachers.length !== 1 ? 's' : ''}</span>
        {(nameQuery || filterCourse || filterSubject) && (
          <button onClick={clearFilters} className="text-xs text-slate-500 underline hover:text-slate-700">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left p-2 text-sm">Nombre y Apellido</th>
              <th className="text-left p-2 text-sm">Email</th>
              <th className="text-left p-2 text-sm">Materias</th>
              <th className="text-right p-2 text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageTeachers.map(teacher => {
              const names = (teacher.subjectIds || []).map(id => subjectsById[id]?.name).filter(Boolean);
              const preview = names.slice(0, 2).join(', ');
              const extra   = names.length - 2;
              return (
                <tr key={teacher.id} className="border-b hover:bg-slate-50">
                  <td className="p-2 text-sm">{[teacher.firstName, teacher.apellido].filter(Boolean).join(' ')}</td>
                  <td className="p-2 text-sm text-slate-600">{teacher.email}</td>
                  <td className="p-2 text-sm max-w-[220px]">
                    <span title={names.join(', ')}>
                      {preview}
                      {extra > 0 && (
                        <span className="ml-1 text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                          +{extra}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleEdit(teacher)} className="text-blue-600 hover:underline text-sm">Editar</button>
                      <button onClick={() => handleDelete(teacher.id)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pageTeachers.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-slate-400 text-sm">No se encontraron docentes</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ──────────────────────────────────────────────────── */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between p-4 mt-4 border-t border-slate-200 bg-slate-50 rounded-lg">
          <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
            className="px-4 py-2 bg-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            ← Anterior
          </button>
          <span className="text-sm font-semibold text-slate-600">
            Página {currentPage + 1} de {pageCount}
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))} disabled={currentPage >= pageCount - 1}
            className="px-4 py-2 bg-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherForm;
