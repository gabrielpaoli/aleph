// components/admin/SubjectForm.jsx

import React, { useState } from 'react';
import { dummyData } from '../../services/dummyData';

const SubjectForm = () => {
  const [subjects, setSubjects] = useState(dummyData.subjects);
  const [formData, setFormData] = useState({
    name: '',
    courseId: ''
  });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      setSubjects(subjects.map(s =>
        s.id === editingId ? { ...formData, id: editingId } : s
      ));
      setEditingId(null);
    } else {
      setSubjects([...subjects, { ...formData, id: Date.now() }]);
    }

    setFormData({ name: '', courseId: '' });
  };

  const handleEdit = (subject) => {
    setFormData(subject);
    setEditingId(subject.id);
  };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar materia?')) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Nombre de la materia"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="border p-2 rounded"
          required
        />
        <select
          value={formData.courseId}
          onChange={(e) => setFormData({...formData, courseId: Number(e.target.value)})}
          className="border p-2 rounded"
          required
        >
          <option value="">Seleccionar curso</option>
          {dummyData.courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name} - {course.shift}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="col-span-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          {editingId ? 'Actualizar' : 'Agregar'} Materia
        </button>
      </form>

      <table className="w-full">
        <thead>
        <tr className="border-b">
          <th className="text-left p-2">Materia</th>
          <th className="text-left p-2">Curso</th>
          <th className="text-left p-2">Acciones</th>
        </tr>
        </thead>
        <tbody>
        {subjects.map(subject => {
          const course = dummyData.courses.find(c => c.id === subject.courseId);
          return (
            <tr key={subject.id} className="border-b">
              <td className="p-2">{subject.name}</td>
              <td className="p-2">{course?.name} - {course?.shift}</td>
              <td className="p-2">
                <button
                  onClick={() => handleEdit(subject)}
                  className="text-blue-600 hover:underline mr-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(subject.id)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  );
};

export default SubjectForm;
