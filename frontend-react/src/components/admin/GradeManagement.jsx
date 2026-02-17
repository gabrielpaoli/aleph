// components/admin/GradeManagement.jsx

import React, { useState } from 'react';
import GradeForm from './GradeForm';
import AdvanceYearDecisionManagement from './AdvanceYearDecisionManagement';
import PeriodGradeManagement from '../teacher/PeriodGradeManagement';
import { useAuth } from '../../context/AuthContext';

const GradeManagement = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('grades');

  const allSubTabs = [
    { id: 'grades', label: 'Notas Individuales', icon: '⭐', component: GradeForm },
    { id: 'period-grades', label: 'Notas Trimestre', icon: '📊', component: PeriodGradeManagement },
    { id: 'advance-year', label: 'Promocion', icon: '📌', component: AdvanceYearDecisionManagement }
  ];

  // Docente solo ve Notas Individuales y Notas Trimestre
  const subTabs = user?.role === 'docente'
    ? allSubTabs.filter(t => t.id === 'grades' || t.id === 'period-grades')
    : allSubTabs;

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
