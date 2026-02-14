// components/admin/AdminPanel.jsx

import React, { useState } from 'react';
import StudentForm from './StudentForm';
import CourseForm from './CourseForm';
import SubjectForm from './SubjectForm';
import TeacherManagement from './TeacherManagement';
import GradeForm from './GradeForm';
import UserManagement from './UserManagement';
import NoteForm from './NoteForm';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('students');

  const tabs = [
    { id: 'students', label: 'Estudiantes', icon: '👨‍🎓', component: StudentForm },
    { id: 'courses', label: 'Cursos', icon: '📚', component: CourseForm },
    { id: 'subjects', label: 'Materias', icon: '📖', component: SubjectForm },
    { id: 'grades', label: 'Calificaciones', icon: '⭐', component: GradeForm },
    { id: 'teachers', label: 'Docentes', icon: '👨‍🏫', component: TeacherManagement },
    { id: 'users', label: 'Usuarios', icon: '👥', component: UserManagement },
    { id: 'notes', label: 'Notas', icon: '📝', component: NoteForm }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-slate-800">⚙️ Panel de Administración</h2>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
