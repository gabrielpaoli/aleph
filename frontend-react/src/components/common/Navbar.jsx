// components/common/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-2 sm:py-3">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <img
              src="https://colegiodelprado.com/wp-content/uploads/2024/08/transparent-background-no-shadow-designify-1.png"
              alt="Colegio del Prado"
              className="h-10 sm:h-12 lg:h-14 w-auto shrink-0"
            />
            <h1 className="text-2xl font-bold hidden sm:block">Sistema Escolar</h1>

            {user?.role === 'preceptor' && (
              <div className="flex flex-wrap gap-1 sm:gap-2 text-sm sm:text-base">
                <Link
                  to="/asistencias"
                  className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  📋 Asistencias
                </Link>
                <Link
                  to="/notificaciones"
                  className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  📧 Notificaciones
                </Link>
                <Link
                  to="/validar-materias"
                  className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  ✅ Validar Materias
                </Link>
                <Link
                  to="/admin"
                  className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  ⚙️ Administración
                </Link>
              </div>
            )}

            {user?.role === 'directivo' && (
              <div className="flex flex-wrap gap-1 sm:gap-2 text-sm sm:text-base">
                <Link
                  to="/admin"
                  className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  ⚙️ Administración
                </Link>
              </div>
            )}

            {user?.role === 'docente' && (
              <div className="flex flex-wrap gap-1 sm:gap-2 text-sm sm:text-base">
                <Link
                  to="/asistencias"
                  className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  📋 Asistencias
                </Link>
                <Link
                  to="/calificaciones"
                  className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  ⭐ Calificaciones
                </Link>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:justify-end">
            <div className="text-left sm:text-right">
              <div className="text-sm font-medium">{user?.email}</div>
              <div className="text-xs text-indigo-200 capitalize">
                {user?.role === 'preceptor' ? '👨‍🏫 Preceptor' : 
                 user?.role === 'directivo' ? '👔 Directivo' :
                 user?.role === 'docente' ? '📚 Docente' :
                 '👨‍👩‍👦 Padre'}
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-rose-500 px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors font-medium shadow-md"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
