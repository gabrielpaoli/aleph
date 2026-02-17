// components/admin/NotesHistory.jsx

import React, { useState, useEffect } from 'react';
import { noteService } from '../../services/api';
import { studentService, userService } from '../../services/api';

const NotesHistory = () => {
  const [notes, setNotes] = useState([]);
  const [students, setStudents] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  // Filters
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedAuthorName, setSelectedAuthorName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Autocomplete suggestions
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);
  const [authorSuggestions, setAuthorSuggestions] = useState([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);

  // Modal
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    loadStudents();
    loadDocentes();
  }, []);

  useEffect(() => {
    loadNotes();
  }, [page, selectedStudent, selectedAuthor, dateFrom, dateTo]);

  useEffect(() => {
    console.log('✅ Docentes cargados:', docentes);
  }, [docentes]);

  const loadStudents = async () => {
    try {
      const data = await studentService.getAll();
      setStudents(data || []);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  const loadDocentes = async () => {
    try {
      const data = await userService.getDocentes();
      setDocentes(data || []);
    } catch (err) {
      console.error('Error loading docentes:', err);
    }
  };

  const handleStudentSearch = (value) => {
    setSelectedStudentName(value);
    
    if (value.trim() === '') {
      setStudentSuggestions(students);
      setShowStudentSuggestions(true);
      return;
    }

    const filtered = students.filter((student) =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(value.toLowerCase())
    );

    setStudentSuggestions(filtered);
    setShowStudentSuggestions(true);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student.id);
    setSelectedStudentName(`${student.firstName} ${student.lastName}`);
    setShowStudentSuggestions(false);
    setPage(1);
  };

  const handleAuthorSearch = (value) => {
    setSelectedAuthorName(value);
    
    if (value.trim() === '') {
      setAuthorSuggestions(docentes);
      setShowAuthorSuggestions(true);
      return;
    }

    const filtered = docentes.filter((docente) =>
      `${docente.firstName} ${docente.lastName}`.toLowerCase().includes(value.toLowerCase())
    );

    setAuthorSuggestions(filtered);
    setShowAuthorSuggestions(true);
  };

  const handleSelectAuthor = (docente) => {
    setSelectedAuthor(docente.id);
    setSelectedAuthorName(`${docente.firstName} ${docente.lastName}`);
    setShowAuthorSuggestions(false);
    setPage(1);
  };

  const handleStudentFocus = () => {
    if (!selectedStudent) {
      setStudentSuggestions(students);
      setShowStudentSuggestions(true);
    }
  };

  const handleAuthorFocus = () => {
    if (!selectedAuthor) {
      console.log('🔍 Author focus - docentes:', docentes);
      setAuthorSuggestions(docentes && docentes.length > 0 ? docentes : []);
      setShowAuthorSuggestions(true);
    }
  };

  const handleBlur = (e) => {
    // Delay para permitir que el click en la sugerencia se registre
    setTimeout(() => {
      setShowStudentSuggestions(false);
      setShowAuthorSuggestions(false);
    }, 150);
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit,
        ...(selectedStudent && { studentId: selectedStudent }),
        ...(selectedAuthor && { authorId: selectedAuthor }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      };

      const data = await noteService.getAllWithPagination(params);
      setNotes(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 0);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Error al cargar el histórico de notas');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedStudent('');
    setSelectedStudentName('');
    setSelectedAuthor('');
    setSelectedAuthorName('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        ❌ {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold mb-6 text-slate-800">📋 Histórico de Notas</h3>

      {/* Filters Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200">
        <h4 className="text-lg font-bold text-slate-700 mb-4">🔍 Filtros</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Student Filter - Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Estudiante
            </label>
            <input
              type="text"
              value={selectedStudentName}
              onChange={(e) => handleStudentSearch(e.target.value)}
              onFocus={handleStudentFocus}
              onBlur={handleBlur}
              placeholder="Seleccionar estudiante..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            {showStudentSuggestions && studentSuggestions.length > 0 && (
              <ul className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {studentSuggestions.map((student) => (
                  <li
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className="px-3 py-2 hover:bg-indigo-100 cursor-pointer border-b border-slate-100 last:border-0 text-sm transition-colors"
                  >
                    {student.firstName} {student.lastName}
                  </li>
                ))}
              </ul>
            )}
            {selectedStudent && (
              <button
                onClick={() => {
                  setSelectedStudent('');
                  setSelectedStudentName('');
                }}
                className="absolute right-2 top-10 text-red-500 hover:text-red-700 text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Author Filter - Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Autor (Profesor)
            </label>
            <input
              type="text"
              value={selectedAuthorName}
              onChange={(e) => handleAuthorSearch(e.target.value)}
              onFocus={handleAuthorFocus}
              onBlur={handleBlur}
              placeholder="Seleccionar autor..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            {showAuthorSuggestions && authorSuggestions.length > 0 && (
              <ul className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {authorSuggestions.map((docente) => (
                  <li
                    key={docente.id}
                    onClick={() => handleSelectAuthor(docente)}
                    className="px-3 py-2 hover:bg-indigo-100 cursor-pointer border-b border-slate-100 last:border-0 text-sm transition-colors"
                  >
                    {docente.firstName} {docente.lastName}
                  </li>
                ))}
              </ul>
            )}
            {selectedAuthor && (
              <button
                onClick={() => {
                  setSelectedAuthor('');
                  setSelectedAuthorName('');
                }}
                className="absolute right-2 top-10 text-red-500 hover:text-red-700 text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-400 text-white font-semibold rounded-lg hover:bg-slate-500 transition-colors text-sm"
          >
            ✖️ Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-4 text-sm text-slate-600">
        Mostrando <strong>{notes.length > 0 ? (page - 1) * limit + 1 : 0}</strong> a{' '}
        <strong>{Math.min(page * limit, total)}</strong> de <strong>{total}</strong> notas
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 text-slate-500">
          ⏳ Cargando notas...
        </div>
      )}

      {/* No Results */}
      {!loading && notes.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-slate-500">📭 No hay notas que coincidan con los filtros</p>
        </div>
      )}

      {/* Notes Table */}
      {!loading && notes.length > 0 && (
        <div className="overflow-x-auto border border-slate-200 rounded-lg mb-6">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Estudiante
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Título</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Autor</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Vista Previa</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">Acción</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note, index) => (
                <tr
                  key={note.id}
                  className={`border-b border-slate-100 hover:bg-blue-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                    {formatDate(note.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                    {note.studentName || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                    {note.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {note.authorName || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                    {note.content}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedNote(note)}
                      className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded hover:bg-indigo-600 transition-colors"
                    >
                      👁️ Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex flex-wrap gap-2 justify-center items-center">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 bg-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            ← Anterior
          </button>

          <div className="flex gap-1">
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((p) => {
                const distance = Math.abs(p - page);
                return distance <= 1 || p === 1 || p === pages;
              })
              .map((p, i, arr) => [
                i > 0 && arr[i - 1] + 1 < p ? (
                  <span key={`dots-${p}`} className="px-2 py-2">
                    ...
                  </span>
                ) : null,
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-2 font-semibold rounded-lg transition-colors text-sm ${
                    page === p
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {p}
                </button>,
              ])}
          </div>

          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page === pages}
            className="px-3 py-2 bg-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal - Ver Nota Completa */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 border-b border-indigo-600">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{selectedNote.title}</h2>
                  <p className="text-indigo-100 text-sm">
                    📅 {formatDate(selectedNote.date)} • 👨‍🏫 {selectedNote.authorName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-white hover:text-indigo-100 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Student Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-600">
                  <strong>Estudiante:</strong> {selectedNote.studentName}
                </p>
              </div>

              {/* Note Content */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2">📝 Contenido de la Nota:</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-slate-700 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {selectedNote.content}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-2">
              <button
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 bg-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-400 transition-colors"
              >
                ✓ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesHistory;
