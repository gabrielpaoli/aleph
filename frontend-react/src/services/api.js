// src/services/api.js

import axios from 'axios';
import { dummyData } from './dummyData';

// ❌ INCORRECTO (causa el error)
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://escuela1.ddev.site';

// ✅ CORRECTO para Vite
const USE_DUMMY_DATA = import.meta.env.VITE_USE_DUMMY_DATA !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://escuela1.ddev.site';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ ESTUDIANTES ============
export const studentService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) return Promise.resolve(dummyData.students);
    const response = await api.get('/api/students');
    return response.data;
  },

  getById: async (id) => {
    if (USE_DUMMY_DATA) {
      return Promise.resolve(dummyData.students.find(s => s.id === id));
    }
    const response = await api.get(`/api/students/${id}`);
    return response.data;
  },

  create: async (studentData) => {
    if (USE_DUMMY_DATA) {
      const newStudent = { ...studentData, id: Date.now() };
      dummyData.students.push(newStudent);
      return Promise.resolve(newStudent);
    }
    const response = await api.post('/api/students', studentData);
    return response.data;
  },

  update: async (id, studentData) => {
    if (USE_DUMMY_DATA) {
      const index = dummyData.students.findIndex(s => s.id === id);
      if (index !== -1) {
        dummyData.students[index] = { ...studentData, id };
        return Promise.resolve(dummyData.students[index]);
      }
    }
    const response = await api.patch(`/api/students/${id}`, studentData);
    return response.data;
  },

  delete: async (id) => {
    if (USE_DUMMY_DATA) {
      dummyData.students = dummyData.students.filter(s => s.id !== id);
      return Promise.resolve({ success: true });
    }
    const response = await api.delete(`/api/students/${id}`);
    return response.data;
  }
};

// ============ CURSOS ============
export const courseService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) return Promise.resolve(dummyData.courses);
    const response = await api.get('/api/courses');
    return response.data;
  }
};

// ============ MATERIAS ============
export const subjectService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) return Promise.resolve(dummyData.subjects);
    const response = await api.get('/api/subjects');
    return response.data;
  }
};

// ============ ASISTENCIAS ============
export const attendanceService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) return Promise.resolve(dummyData.attendance);
    const response = await api.get('/api/attendance');
    return response.data;
  },

  getByStudent: async (studentId) => {
    if (USE_DUMMY_DATA) {
      return Promise.resolve(dummyData.attendance.filter(a => a.studentId === studentId));
    }
    const response = await api.get(`/api/attendance?studentId=${studentId}`);
    return response.data;
  },

  getByDate: async (date) => {
    if (USE_DUMMY_DATA) {
      return Promise.resolve(dummyData.attendance.filter(a => a.date === date));
    }
    const response = await api.get(`/api/attendance?date=${date}`);
    return response.data;
  },

  getByCourseAndMonth: async (courseId, year, month) => {
    if (USE_DUMMY_DATA) {
      const students = dummyData.students.filter(s => s.courseId === courseId);
      const studentIds = students.map(s => s.id);
      const monthStr = String(month + 1).padStart(2, '0');
      const yearStr = String(year);
      return Promise.resolve(
        dummyData.attendance.filter(a =>
          studentIds.includes(a.studentId) &&
          a.date.startsWith(`${yearStr}-${monthStr}`)
        )
      );
    }
    const response = await api.get(`/api/attendance?courseId=${courseId}&year=${year}&month=${month}`);
    return response.data;
  },

  update: async (id, attendanceData) => {
    if (USE_DUMMY_DATA) {
      const index = dummyData.attendance.findIndex(a => a.id === id);
      if (index !== -1) {
        dummyData.attendance[index] = { ...attendanceData, id };
        return Promise.resolve(dummyData.attendance[index]);
      }
    }
    const response = await api.patch(`/api/attendance/${id}`, attendanceData);
    return response.data;
  },

  create: async (attendanceData) => {
    if (USE_DUMMY_DATA) {
      const newAttendance = { ...attendanceData, id: Date.now() };
      dummyData.attendance.push(newAttendance);
      return Promise.resolve(newAttendance);
    }
    const response = await api.post('/api/attendance', attendanceData);
    return response.data;
  },

  bulkUpdate: async (attendanceArray) => {
    if (USE_DUMMY_DATA) {
      attendanceArray.forEach(att => {
        const existing = dummyData.attendance.find(
          a => a.studentId === att.studentId && a.date === att.date
        );
        if (existing) {
          Object.assign(existing, att);
        } else {
          dummyData.attendance.push({ ...att, id: Date.now() + Math.random() });
        }
      });
      return Promise.resolve({ success: true, count: attendanceArray.length });
    }
    const response = await api.post('/api/attendance/bulk', attendanceArray);
    return response.data;
  }
};

// ============ NOTAS ============
export const gradeService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) return Promise.resolve(dummyData.grades);
    const response = await api.get('/api/grades');
    return response.data;
  },

  getByStudent: async (studentId) => {
    if (USE_DUMMY_DATA) {
      return Promise.resolve(dummyData.grades.filter(g => g.studentId === studentId));
    }
    const response = await api.get(`/api/grades?studentId=${studentId}`);
    return response.data;
  }
};

// ============ AUTENTICACIÓN ============
export const authService = {
  login: async (email, password) => {
    if (USE_DUMMY_DATA) {
      const user = dummyData.users.find(u => u.email === email);
      if (user) {
        localStorage.setItem('authToken', 'dummy-token-' + user.id);
        return Promise.resolve({ success: true, user, token: 'dummy-token' });
      }
      return Promise.resolve({ success: false, error: 'Credenciales inválidas' });
    }
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem('authToken');
    if (USE_DUMMY_DATA) {
      return Promise.resolve({ success: true });
    }
    const response = await api.post('/api/auth/logout');
    return response.data;
  }
};

// ============ NOTIFICACIONES ============
export const notificationService = {
  sendAbsenceEmails: async (date, studentIds) => {
    if (USE_DUMMY_DATA) {
      console.log('Enviando emails de ausencia:', { date, studentIds });
      return Promise.resolve({
        success: true,
        sent: studentIds.length,
        message: `${studentIds.length} emails enviados`
      });
    }
    const response = await api.post('/api/notifications/absence', { date, studentIds });
    return response.data;
  }
};

export default api;
