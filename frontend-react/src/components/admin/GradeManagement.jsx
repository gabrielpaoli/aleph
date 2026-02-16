// components/admin/GradeManagement.jsx

import React, { useState } from 'react';
import GradeForm from './GradeForm';
import SubjectValidation from '../preceptor/SubjectValidation';
import PeriodGradeManagement from '../teacher/PeriodGradeManagement';

const GradeManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('grades');

  const subTabs = [
    { id: 'grades', label: 'Notas Individuales', icon: '⭐', component: GradeForm },
    { id: 'period-grades', label: 'Notas Trimestre', icon: '📊', component: PeriodGradeManagement },
    { id: 'validation', label: 'Validar Materias', icon: '✅', component: SubjectValidation }
  ];

  const ActiveSubComponent = subTabs.find(t => t.id === activeSubTab)?.component;

  return (
    <div>
      {/* Sub-tabs para Calificaciones */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeSubTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del sub-tab activo */}
      <div>
        {ActiveSubComponent && <ActiveSubComponent />}
      </div>
    </div>
  );
};

export default GradeManagement;
