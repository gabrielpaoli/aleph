// components/common/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold">🎓 Sistema Escolar</h1>

            {user?.role === 'preceptor' && (
              <div className="flex gap-1">
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
                  to="/admin"
                  className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  ⚙️ Administración
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{user?.email}</div>
              <div className="text-xs text-indigo-200 capitalize">
                {user?.role === 'preceptor' ? '👨‍🏫 Preceptor' : '👨‍👩‍👦 Padre'}
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
