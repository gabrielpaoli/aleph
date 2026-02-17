// components/parent/NotesList.jsx

import React, { useState, useEffect } from 'react';
import { noteService } from '../../services/api';

const NotesList = ({ studentId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotes();
  }, [studentId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError('');
      if (studentId) {
        const notesData = await noteService.getByStudent(studentId);
        setNotes(notesData || []);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando notas...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        ❌ {error}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-500">📭 No hay notas en este momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">📬 Notas Recibidas</h3>
      {notes.map(note => (
        <div
          key={note.id}
          className="bg-white border-l-4 border-indigo-500 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
            <h4 className="font-bold text-slate-800 text-lg">{note.title}</h4>
            <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {new Date(note.date || note.created).toLocaleDateString('es-AR')}
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-2">De: {note.authorName || 'Docente'}</p>
          <p className="text-slate-700">{note.content}</p>
        </div>
      ))}
    </div>
  );
};

export default NotesList;
