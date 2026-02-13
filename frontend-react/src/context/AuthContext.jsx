// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentar restaurar sesión al cargar
    checkSession();
  }, []);

  const checkSession = async () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        console.log('📦 Loaded user from localStorage:', parsed);
        
        // Debug for parents
        if (parsed.role === 'parent') {
          console.log('👨‍👩‍👧 Parent user from localStorage');
          console.log('   studentIds:', parsed.studentIds);
          console.log('   studentIds count:', parsed.studentIds?.length || 0);
        }
        
        // Verificar que la sesión sigue activa en el servidor
        const currentUser = await authService.getCurrentUser();
        console.log('✅ Session verified with server:', currentUser.email);
        
        // Debug para padres
        if (currentUser.role === 'parent') {
          console.log('👨‍👩‍👧 Parent user from server');
          console.log('   studentIds:', currentUser.studentIds);
          console.log('   studentIds count:', currentUser.studentIds?.length || 0);
        }
        
        setUser(currentUser);
      } catch (error) {
        console.warn('⚠️ Session expired, clearing local data');
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const result = await authService.login(email, password);

      if (result.success) {
        console.log('✅ Login successful. User data:', result.user);
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('authToken', result.token);
        
        // Debug para padres
        if (result.user.role === 'parent') {
          console.log('👨‍👩‍👧 Parent user logged in');
          console.log('   Has studentIds:', !!result.user.studentIds);
          console.log('   studentIds count:', result.user.studentIds?.length || 0);
          console.log('   studentIds:', result.user.studentIds);
        }
        
        return { success: true, user: result.user };
      }

      console.log('❌ Login failed:', result.error);
      return { success: false, error: result.error };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }

    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    console.log('👋 Logged out');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">⏳ Cargando...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
