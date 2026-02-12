// components/admin/TeacherForm.jsx

import React, { useState } from 'react';
import { dummyData } from '../../services/dummyData';

const TeacherForm = () => {
  const [teachers, setTeachers] = useState(dummyData.teachers || []);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subjectIds: []
  });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      setTeachers(teachers.map(t =>
        t.id === editingId ? { ...formData, id: editingId } : t
      ));
      setEditingId(null);
    } else {
      setTeachers([...teachers, { ...formData, id: Date.now() }]);
    }

    setFormData({ firstName: '', lastName: '', email: '', subjectIds: [] });
  };

  const handleEdit = (teacher) => {
    setFormData(teacher);
    setEditingId(teacher.id);
  };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar docente?')) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter(id => id !== subjectId)
        : [...prev.subjectIds, subjectId]
    }));
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Apellido"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            className="border p-2 rounded"
            required
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full border p-2 rounded"
          required
        />

        <div className="border p-4 rounded">
          <p className="font-semibold mb-2">Materias que dicta:</p>
          <div className="grid grid-cols-2 gap-2">
            {dummyData.subjects.map(subject => {
              const course = dummyData.courses.find(c => c.id === subject.courseId);
              return (
                <label key={subject.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.subjectIds.includes(subject.id)}
                    onChange={() => handleSubjectToggle(subject.id)}
                  />
                  <span className="text-sm">
                    {subject.name} ({course?.name})
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          {editingId ? 'Actualizar' : 'Agregar'} Docente
        </button>
      </form>

      <table className="w-full">
        <thead>
        <tr className="border-b">
          <th className="text-left p-2">Nombre</th>
          <th className="text-left p-2">Email</th>
          <th className="text-left p-2">Materias</th>
          <th className="text-right p-2">Acciones</th>
        </tr>
        </thead>
        <tbody>
        {teachers.map(teacher => (
          <tr key={teacher.id} className="border-b">
            <td className="p-2">{teacher.lastName}, {teacher.firstName}</td>
            <td className="p-2">{teacher.email}</td>
            <td className="p-2">
              {teacher.subjectIds.map(subId => {
                const subject = dummyData.subjects.find(s => s.id === subId);
                return subject?.name;
              }).join(', ')}
            </td>
            <td className="p-2">
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleEdit(teacher)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(teacher.id)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherForm;
