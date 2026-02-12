// components/admin/StudentForm.jsx (versión completa con enlaces)

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dummyData } from '../../services/dummyData';

const StudentForm = () => {
  const [students, setStudents] = useState(dummyData.students);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    courseId: ''
  });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      setStudents(students.map(s =>
        s.id === editingId ? { ...formData, id: editingId } : s
      ));
      setEditingId(null);
    } else {
      setStudents([...students, { ...formData, id: Date.now() }]);
    }

    setFormData({ firstName: '', lastName: '', email: '', courseId: '' });
  };

  const handleEdit = (student) => {
    setFormData(student);
    setEditingId(student.id);
  };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar estudiante?')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4">
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
        <input
          type="email"
          placeholder="Email del padre"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
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
          {editingId ? 'Actualizar' : 'Agregar'} Estudiante
        </button>
      </form>

      <table className="w-full">
        <thead>
        <tr className="border-b bg-gray-100">
          <th className="text-left p-2">Nombre</th>
          <th className="text-left p-2">Apellido</th>
          <th className="text-left p-2">Email</th>
          <th className="text-left p-2">Curso</th>
          <th className="text-left p-2">Acciones</th>
        </tr>
        </thead>
        <tbody>
        {students.map(student => {
          const course = dummyData.courses.find(c => c.id === student.courseId);
          return (
            <tr key={student.id} className="border-b hover:bg-gray-50">
              <td className="p-2">
                <Link
                  to={`/estudiante/${student.id}`}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  {student.firstName}
                </Link>
              </td>
              <td className="p-2">{student.lastName}</td>
              <td className="p-2 text-sm text-gray-600">{student.email}</td>
              <td className="p-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {course?.name}
                  </span>
              </td>
              <td className="p-2">
                <div className="flex gap-2">
                  <Link
                    to={`/estudiante/${student.id}`}
                    className="text-green-600 hover:underline text-sm"
                  >
                    👁️ Ver
                  </Link>
                  <button
                    onClick={() => handleEdit(student)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  );
};

export default StudentForm;
