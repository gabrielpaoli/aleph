// components/admin/NoteForm.jsx

import React, { useState, useEffect } from 'react';
import { noteService } from '../../services/api';
import { studentService } from '../../services/api';
import { courseService } from '../../services/api';
import NotesHistory from './NotesHistory';

const NoteForm = () => {
  const [activeTab, setActiveTab] = useState('send'); // 'send' or 'history'
  const [noteType, setNoteType] = useState('individual');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, coursesData] = await Promise.all([
        studentService.getAll(),
        courseService.getAll()
      ]);
      setStudents(studentsData || []);
      setCourses(coursesData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (!content.trim()) {
      setError('El contenido es requerido');
      return;
    }

    if (noteType === 'individual' && !selectedStudent) {
      setError('Selecciona un estudiante');
      return;
    }

    if (noteType === 'course' && !selectedCourse) {
      setError('Selecciona un curso');
      return;
    }

    try {
      setLoading(true);
      const noteData = {
        title,
        content,
        type: noteType
      };

      if (noteType === 'individual') {
        noteData.studentId = selectedStudent;
      } else {
        noteData.courseId = selectedCourse;
      }

      await noteService.create(noteData);
      setMessage(`Nota ${noteType === 'individual' ? 'enviada al estudiante' : 'enviada al curso'} y correos notificados`);
      setTitle('');
      setContent('');
      setSelectedStudent('');
      setSelectedCourse('');
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Error al crear la nota: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Sub-tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('send')}
          className={`px-6 py-3 font-bold transition-colors border-b-2 ${
            activeTab === 'send'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          📤 Enviar Nota
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-bold transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          📋 Histórico
        </button>
      </div>

      {/* Send Note Tab */}
      {activeTab === 'send' && (
        <div className="max-w-2xl w-full">
          <h3 className="text-2xl font-bold mb-6 text-slate-800">📝 Enviar Nota a Estudiantes</h3>

          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Tipo de Nota</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="individual"
                    checked={noteType === 'individual'}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700">Para un estudiante</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="course"
                    checked={noteType === 'course'}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700">Para un curso completo</span>
                </label>
              </div>
            </div>

            {/* Student Selection */}
            {noteType === 'individual' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Estudiante</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Selecciona un estudiante...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Course Selection */}
            {noteType === 'course' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Curso</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Selecciona un curso...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name || course.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Recordatorio de Tarea"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contenido</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe el contenido de la nota..."
                rows="6"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              {loading ? 'Enviando...' : '📤 Enviar Nota'}
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && <NotesHistory />}
    </div>
  );
};

export default NoteForm;
