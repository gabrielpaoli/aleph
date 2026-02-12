// context/AuthContext.jsx

import React, { createContext, useState, useContext } from 'react';
import { dummyData } from '../services/dummyData';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    // Simulación de login
    const foundUser = dummyData.users.find(u => u.email === email);

    if (foundUser) {
      setUser(foundUser);
      return { success: true, user: foundUser };
    }

    return { success: false, error: 'Usuario no encontrado' };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
