// components/admin/CourseForm.jsx

import React, { useState } from 'react';
import { dummyData } from '../../services/dummyData';

const CourseForm = () => {
  const [courses, setCourses] = useState(dummyData.courses);
  const [formData, setFormData] = useState({
    name: '',
    shift: '',
    schoolId: 1
  });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      setCourses(courses.map(c =>
        c.id === editingId ? { ...formData, id: editingId } : c
      ));
      setEditingId(null);
    } else {
      setCourses([...courses, { ...formData, id: Date.now() }]);
    }

    setFormData({ name: '', shift: '', schoolId: 1 });
  };

  const handleEdit = (course) => {
    setFormData(course);
    setEditingId(course.id);
  };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar curso?')) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Nombre (ej: 1A)"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="border p-2 rounded"
          required
        />
        <select
          value={formData.shift}
          onChange={(e) => setFormData({...formData, shift: e.target.value})}
          className="border p-2 rounded"
          required
        >
          <option value="">Seleccionar turno</option>
          <option value="Mañana">Mañana</option>
          <option value="Tarde">Tarde</option>
          <option value="Noche">Noche</option>
        </select>
        <select
          value={formData.schoolId}
          onChange={(e) => setFormData({...formData, schoolId: Number(e.target.value)})}
          className="border p-2 rounded"
          required
        >
          {dummyData.schools.map(school => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="col-span-3 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          {editingId ? 'Actualizar' : 'Agregar'} Curso
        </button>
      </form>

      <table className="w-full">
        <thead>
        <tr className="border-b">
          <th className="text-left p-2">Nombre</th>
          <th className="text-left p-2">Turno</th>
          <th className="text-left p-2">Escuela</th>
          <th className="text-left p-2">Acciones</th>
        </tr>
        </thead>
        <tbody>
        {courses.map(course => {
          const school = dummyData.schools.find(s => s.id === course.schoolId);
          return (
            <tr key={course.id} className="border-b">
              <td className="p-2">{course.name}</td>
              <td className="p-2">{course.shift}</td>
              <td className="p-2">{school?.name}</td>
              <td className="p-2">
                <button
                  onClick={() => handleEdit(course)}
                  className="text-blue-600 hover:underline mr-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
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

export default CourseForm;
