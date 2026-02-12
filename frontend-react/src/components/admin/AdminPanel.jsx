// components/admin/AdminPanel.jsx

import React, { useState } from 'react';
import StudentForm from './StudentForm';
import CourseForm from './CourseForm';
import SubjectForm from './SubjectForm';
import TeacherForm from './TeacherForm';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('students');

  const tabs = [
    { id: 'students', label: 'Estudiantes', icon: '👨‍🎓', component: StudentForm },
    { id: 'courses', label: 'Cursos', icon: '📚', component: CourseForm },
    { id: 'subjects', label: 'Materias', icon: '📖', component: SubjectForm },
    { id: 'teachers', label: 'Docentes', icon: '👨‍🏫', component: TeacherForm }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-slate-800">⚙️ Panel de Administración</h2>

        <div className="mb-6">
          <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all ${
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
