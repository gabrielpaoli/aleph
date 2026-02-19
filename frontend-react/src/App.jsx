// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/common/Login';
import Navbar from './components/common/Navbar';
import AttendanceTable from './components/preceptor/AttendanceTable';
import AbsenceNotification from './components/preceptor/AbsenceNotification';
import StudentDashboard from './components/parent/StudentDashboard';
import StudentProfile from './components/student/StudentProfile';
import AdminPanel from './components/admin/AdminPanel';
import ProfileSettings from './components/common/ProfileSettings';
import ResetPassword from './components/common/ResetPassword';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Public route: accessible without login
  if (location.pathname === '/reset-password') {
    return <ResetPassword />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        {user.role === 'preceptor' && (
          <>
            <Route path="/" element={<Navigate to="/asistencias" />} />
            <Route path="/asistencias" element={<AttendanceTable />} />
            <Route path="/notificaciones" element={<AbsenceNotification />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/estudiante/:studentId" element={<StudentProfile />} />
            <Route path="/perfil" element={<ProfileSettings />} />
          </>
        )}

        {user.role === 'directivo' && (
          <>
            <Route path="/" element={<Navigate to="/admin" />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/estudiante/:studentId" element={<StudentProfile />} />
            <Route path="/perfil" element={<ProfileSettings />} />
          </>
        )}

        {user.role === 'docente' && (
          <>
            <Route path="/" element={<Navigate to="/asistencias" />} />
            <Route path="/asistencias" element={<AttendanceTable />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/estudiante/:studentId" element={<StudentProfile />} />
            <Route path="/perfil" element={<ProfileSettings />} />
          </>
        )}

        {user.role === 'parent' && (
          <>
            <Route path="/" element={<Navigate to={`/estudiante/${user.studentIds?.[0] || user.studentId}`} />} />
            <Route path="/estudiante" element={<Navigate to={`/estudiante/${user.studentIds?.[0] || user.studentId}`} />} />
            <Route path="/estudiante/:studentId" element={<StudentProfile />} />
            <Route path="/perfil" element={<ProfileSettings />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
