// src/services/api.js

import axios from 'axios';
import { dummyData } from './dummyData';
import config from '../config';

const USE_DUMMY_DATA = config.useDummyData;
const API_BASE_URL = config.apiUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ← IMPORTANTE: Enviar cookies
});

// Interceptor para debug
api.interceptors.request.use((config) => {
  console.log('📤 Request:', config.method.toUpperCase(), config.url);
  console.log('   With credentials:', config.withCredentials);
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.message);
    console.error('   URL:', error.config?.url);
    console.error('   Data:', error.response?.data);

    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('⚠️ Authentication error - user may need to login again');
    }
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ ESTUDIANTES ============
export const studentService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for students');
      return Promise.resolve(dummyData.students);
    }
    console.log('🌐 Fetching students from API');
    const response = await api.get('/api/estudiantes');
    return response.data;
  },

  getById: async (id) => {
    if (USE_DUMMY_DATA) {
      return Promise.resolve(dummyData.students.find(s => s.id === id));
    }
    const response = await api.get(`/api/estudiantes/${id}`);
    return response.data;
  },

  getByParentEmail: async (parentEmail) => {
    if (USE_DUMMY_DATA) {
      // Filter students by parent email
      return Promise.resolve(dummyData.students.filter(s => s.email === parentEmail));
    }
    console.log('🌐 Fetching students for parent:', parentEmail);
    const response = await api.get(`/api/students/parent/${encodeURIComponent(parentEmail)}`);
    return response.data;
  },

  create: async (studentData) => {
    if (USE_DUMMY_DATA) {
      const newStudent = { ...studentData, id: Date.now() };
      dummyData.students.push(newStudent);
      return Promise.resolve(newStudent);
    }
    const response = await api.post('/api/estudiantes', studentData);
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
    const response = await api.patch(`/api/estudiantes/${id}`, studentData);
    return response.data;
  },

  delete: async (id) => {
    if (USE_DUMMY_DATA) {
      dummyData.students = dummyData.students.filter(s => s.id !== id);
      return Promise.resolve({ success: true });
    }
    const response = await api.delete(`/api/estudiantes/${id}`);
    return response.data;
  }
};

// ============ CURSOS ============
export const courseService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for courses');
      return Promise.resolve(dummyData.courses);
    }
    console.log('🌐 Fetching courses from API');
    try {
      const response = await api.get('/api/courses');
      console.log('✅ Courses from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      throw error;
    }
  },

  create: async (courseData) => {
    if (USE_DUMMY_DATA) {
      const newCourse = { ...courseData, id: Date.now() };
      dummyData.courses.push(newCourse);
      return Promise.resolve(newCourse);
    }
    console.log('🌐 Creating course in API');
    try {
      const response = await api.post('/api/courses', courseData);
      console.log('✅ Course created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating course:', error);
      throw error;
    }
  },

  update: async (id, courseData) => {
    if (USE_DUMMY_DATA) {
      const index = dummyData.courses.findIndex(c => c.id === id);
      if (index !== -1) {
        dummyData.courses[index] = { ...courseData, id };
        return Promise.resolve(dummyData.courses[index]);
      }
    }
    console.log('🌐 Updating course in API');
    try {
      const response = await api.patch(`/api/courses/${id}`, courseData);
      console.log('✅ Course updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating course:', error);
      throw error;
    }
  },

  delete: async (id) => {
    if (USE_DUMMY_DATA) {
      dummyData.courses = dummyData.courses.filter(c => c.id !== id);
      return Promise.resolve({ success: true });
    }
    console.log('🌐 Deleting course from API');
    try {
      await api.delete(`/api/courses/${id}`);
      console.log('✅ Course deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting course:', error);
      throw error;
    }
  }
};

// ============ MATERIAS ============
export const subjectService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for subjects');
      return Promise.resolve(dummyData.subjects);
    }
    console.log('🌐 Fetching subjects from API');
    const response = await api.get('/api/subjects');
    return response.data;
  },

  create: async (subjectData) => {
    if (USE_DUMMY_DATA) {
      const newSubject = { ...subjectData, id: Date.now() };
      dummyData.subjects.push(newSubject);
      return Promise.resolve(newSubject);
    }
    console.log('🌐 Creating subject in API');
    try {
      const response = await api.post('/api/subjects', subjectData);
      console.log('✅ Subject created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating subject:', error);
      throw error;
    }
  },

  update: async (id, subjectData) => {
    if (USE_DUMMY_DATA) {
      const index = dummyData.subjects.findIndex(s => s.id === id);
      if (index !== -1) {
        dummyData.subjects[index] = { ...subjectData, id };
        return Promise.resolve(dummyData.subjects[index]);
      }
    }
    console.log('🌐 Updating subject in API');
    try {
      const response = await api.patch(`/api/subjects/${id}`, subjectData);
      console.log('✅ Subject updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating subject:', error);
      throw error;
    }
  },

  delete: async (id) => {
    if (USE_DUMMY_DATA) {
      dummyData.subjects = dummyData.subjects.filter(s => s.id !== id);
      return Promise.resolve({ success: true });
    }
    console.log('🌐 Deleting subject from API');
    try {
      await api.delete(`/api/subjects/${id}`);
      console.log('✅ Subject deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting subject:', error);
      throw error;
    }
  }
};

// ============ ASISTENCIAS ============
export const attendanceService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) {
      return Promise.resolve(dummyData.attendance);
    }
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

  sendAbsenceEmails: async (date, studentIds) => {
    return notificationService.sendAbsenceEmails(date, studentIds);
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
      console.log('📦 Using dummy data for attendance');
      const students = dummyData.students.filter(s => s.courseId === courseId);
      const studentIds = students.map(s => s.id);
      const monthStr = String(month + 1).padStart(2, '0');
      return Promise.resolve(
        dummyData.attendance.filter(a =>
          studentIds.includes(a.studentId) &&
          a.date.startsWith(`${year}-${monthStr}`)
        )
      );
    }
    console.log(`🌐 Fetching attendance for course ${courseId}, ${year}-${month}`);
    const response = await api.get(`/api/attendance?courseId=${courseId}&year=${year}&month=${month}`);
    return response.data;
  },

  getByCourseAndYear: async (courseId, year) => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for attendance (full year)');
      const students = dummyData.students.filter(s => s.courseId === courseId);
      const studentIds = students.map(s => s.id);
      return Promise.resolve(
        dummyData.attendance.filter(a =>
          studentIds.includes(a.studentId) &&
          a.date.startsWith(`${year}`)
        )
      );
    }
    console.log(`🌐 Fetching attendance for course ${courseId}, year ${year}`);
    const response = await api.get(`/api/attendance?courseId=${courseId}&year=${year}`);
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
      console.log('📦 Bulk updating dummy attendance data');
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
    console.log('🌐 Bulk updating attendance via API');
    const response = await api.post('/api/attendance/bulk', attendanceArray);
    return response.data;
  }
};

// ============ NOTAS ============
export const gradeService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) {
      return Promise.resolve(dummyData.grades);
    }
    // Agregar timestamp para evitar caché del navegador
    const response = await api.get(`/api/grades?_t=${Date.now()}`);
    return response.data;
  },

  getByStudent: async (studentId) => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for grades');
      return Promise.resolve(dummyData.grades.filter(g => g.studentId === studentId));
    }
    console.log(`🌐 Fetching grades for student ${studentId}`);
    // Agregar timestamp para evitar caché del navegador
    const response = await api.get(`/api/grades?studentId=${studentId}&_t=${Date.now()}`);
    console.log('✅ Grades response data:', response.data);
    return response.data;
  },

  create: async (gradeData) => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Creating dummy grade:', gradeData);
      const newGrade = { ...gradeData, id: Date.now() };
      dummyData.grades.push(newGrade);
      return Promise.resolve(newGrade);
    }
    console.log('🌐 Creating grade via API:', gradeData);
    try {
      const response = await api.post('/api/grades', gradeData);
      console.log('✅ Grade created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating grade:', error);
      throw error;
    }
  },

  update: async (id, gradeData) => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Updating dummy grade:', id, gradeData);
      const index = dummyData.grades.findIndex(g => g.id === id);
      if (index !== -1) {
        dummyData.grades[index] = { ...dummyData.grades[index], ...gradeData };
        return Promise.resolve(dummyData.grades[index]);
      }
      return Promise.reject(new Error('Grade not found'));
    }
    console.log('🌐 Updating grade via API:', id, gradeData);
    try {
      const response = await api.patch(`/api/grades/${id}`, gradeData);
      console.log('✅ Grade updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating grade:', error);
      throw error;
    }
  },

  delete: async (id) => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Deleting dummy grade:', id);
      dummyData.grades = dummyData.grades.filter(g => g.id !== id);
      return Promise.resolve({ success: true });
    }
    console.log('🌐 Deleting grade via API:', id);
    try {
      const response = await api.delete(`/api/grades/${id}`);
      console.log('✅ Grade deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting grade:', error);
      throw error;
    }
  }
};

// src/services/api.js

// ============ AUTENTICACIÓN ============
export const authService = {
  login: async (email, password) => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy authentication');
      const user = dummyData.users.find(u => u.email === email);
      if (user) {
        localStorage.setItem('authToken', 'dummy-token-' + user.id);
        return Promise.resolve({ success: true, user, token: 'dummy-token' });
      }
      return Promise.resolve({ success: false, error: 'Credenciales inválidas' });
    }

    console.log('🌐 Authenticating via API:', email);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      console.log('✅ Full login response:', response.data);
      
      // Debug para padres
      if (response.data.user && response.data.user.role === 'parent') {
        console.log('👨‍👩‍👧 Parent login detected');
        console.log('   Full user object:', response.data.user);
        console.log('   studentIds type:', typeof response.data.user.studentIds);
        console.log('   studentIds value:', response.data.user.studentIds);
        console.log('   studentIds length:', response.data.user.studentIds?.length);
        console.log('   studentId (main):', response.data.user.studentId);
      }

      if (response.data.success && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        return response.data;
      }

      return response.data;
    } catch (error) {
      console.error('❌ Login API error:', error);
      throw error;
    }
  },

  logout: async () => {
    localStorage.removeItem('authToken');
    if (USE_DUMMY_DATA) {
      return Promise.resolve({ success: true });
    }

    try {
      const response = await api.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  },

  getCurrentUser: async () => {
    if (USE_DUMMY_DATA) {
      const token = localStorage.getItem('authToken');
      if (token) {
        const userId = parseInt(token.replace('dummy-token-', ''));
        const user = dummyData.users.find(u => u.id === userId);
        return Promise.resolve(user);
      }
      return Promise.resolve(null);
    }

    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }
};

// ============ NOTIFICACIONES ============
export const notificationService = {
  sendAbsenceEmails: async (date, studentIds) => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Simulating email sending');
      console.log('Enviando emails de ausencia:', { date, studentIds });
      return Promise.resolve({
        success: true,
        sent: studentIds.length,
        message: `${studentIds.length} emails enviados`
      });
    }
    console.log('🌐 Sending emails via API');
    const response = await api.post('/api/notifications/absence', { date, studentIds });
    return response.data;
  }
};

// ============ USUARIOS ============
export const userService = {
  create: async (userData) => {
    if (USE_DUMMY_DATA) {
      const newUser = { ...userData, id: Date.now() };
      dummyData.users.push(newUser);
      return Promise.resolve(newUser);
    }
    console.log('🌐 Creating user in API');
    try {
      const response = await api.post('/api/users', userData);
      console.log('✅ User created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  },

  update: async (userId, userData) => {
    if (USE_DUMMY_DATA) {
      const user = dummyData.users.find(u => u.id === userId);
      if (user) {
        Object.assign(user, userData);
      }
      return Promise.resolve(user);
    }
    console.log('🌐 Updating user:', userId);
    try {
      const response = await api.patch(`/api/users/${userId}`, userData);
      console.log('✅ User updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  },

  getTeachers: async () => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for teachers');
      return Promise.resolve(dummyData.users.filter(u => u.role === 'docente'));
    }
    console.log('🌐 Fetching teachers from API');
    try {
      const response = await api.get('/api/docentes');
      console.log('✅ Teachers:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching teachers:', error);
      throw error;
    }
  },

  createTeacher: async (teacherData) => {
    if (USE_DUMMY_DATA) {
      const newTeacher = { ...teacherData, id: Date.now(), role: 'docente' };
      dummyData.users.push(newTeacher);
      return Promise.resolve({ success: true, ...newTeacher });
    }
    console.log('🌐 Creating teacher in API');
    try {
      const response = await api.post('/api/docentes', teacherData);
      console.log('✅ Teacher created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating teacher:', error);
      throw error;
    }
  },

  updateTeacher: async (id, teacherData) => {
    if (USE_DUMMY_DATA) {
      const index = dummyData.users.findIndex(u => u.id === id);
      if (index !== -1) {
        dummyData.users[index] = { ...dummyData.users[index], ...teacherData };
        return Promise.resolve({ success: true, ...dummyData.users[index] });
      }
      return Promise.reject(new Error('Teacher not found'));
    }
    console.log('🌐 Updating teacher:', id);
    try {
      const response = await api.patch(`/api/docentes/${id}`, teacherData);
      console.log('✅ Teacher updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating teacher:', error);
      throw error;
    }
  },

  getByRole: async (role) => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for users');
      return Promise.resolve(dummyData.users.filter(u => u.role === role));
    }
    console.log('🌐 Fetching users by role:', role);
    try {
      const response = await api.get(`/api/users/role/${role}`);
      console.log('✅ Users:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  },

  updateRole: async (userId, role) => {
    if (USE_DUMMY_DATA) {
      const user = dummyData.users.find(u => u.id === userId);
      if (user) {
        user.role = role;
      }
      return Promise.resolve(user);
    }
    console.log('🌐 Updating user role:', userId, role);
    try {
      const response = await api.patch(`/api/users/${userId}/role`, { role });
      console.log('✅ User role updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  },

  delete: async (userId) => {
    if (USE_DUMMY_DATA) {
      dummyData.users = dummyData.users.filter(u => u.id !== userId);
      return Promise.resolve({ success: true });
    }
    console.log('🌐 Deleting user');
    try {
      const response = await api.delete(`/api/users/${userId}`);
      console.log('✅ User deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }
};

// ============ TEACHERS ============
export const teacherService = {
  getAll: async () => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for teachers');
      return Promise.resolve(dummyData.teachers || []);
    }
    console.log('🌐 Fetching teachers from API');
    try {
      const response = await api.get('/api/teachers');
      console.log('✅ Teachers from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching teachers:', error);
      throw error;
    }
  },

  getById: async (id) => {
    if (USE_DUMMY_DATA) {
      return Promise.resolve(dummyData.teachers?.find(t => t.id === id) || null);
    }
    console.log('🌐 Fetching teacher:', id);
    try {
      const response = await api.get(`/api/teachers/${id}`);
      console.log('✅ Teacher from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching teacher:', error);
      throw error;
    }
  },

  create: async (teacherData) => {
    if (USE_DUMMY_DATA) {
      const newTeacher = { ...teacherData, id: Date.now() };
      dummyData.teachers = dummyData.teachers || [];
      dummyData.teachers.push(newTeacher);
      return Promise.resolve(newTeacher);
    }
    console.log('🌐 Creating teacher in API');
    try {
      const response = await api.post('/api/teachers', teacherData);
      console.log('✅ Teacher created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating teacher:', error);
      throw error;
    }
  },

  update: async (id, teacherData) => {
    if (USE_DUMMY_DATA) {
      const index = dummyData.teachers?.findIndex(t => t.id === id) ?? -1;
      if (index !== -1) {
        dummyData.teachers[index] = { ...teacherData, id };
        return Promise.resolve(dummyData.teachers[index]);
      }
      return Promise.reject(new Error('Teacher not found'));
    }
    console.log('🌐 Updating teacher:', id);
    try {
      const response = await api.patch(`/api/teachers/${id}`, teacherData);
      console.log('✅ Teacher updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating teacher:', error);
      throw error;
    }
  },

  delete: async (id) => {
    if (USE_DUMMY_DATA) {
      dummyData.teachers = dummyData.teachers?.filter(t => t.id !== id) || [];
      return Promise.resolve({ success: true });
    }
    console.log('🌐 Deleting teacher:', id);
    try {
      const response = await api.delete(`/api/teachers/${id}`);
      console.log('✅ Teacher deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting teacher:', error);
      throw error;
    }
  }
};

// ============ NOTES ============
export const noteService = {
  create: async (noteData) => {
    if (USE_DUMMY_DATA) {
      const newNote = { ...noteData, id: Date.now() };
      dummyData.notes = dummyData.notes || [];
      dummyData.notes.push(newNote);
      return Promise.resolve(newNote);
    }
    console.log('🌐 Creating note in API');
    try {
      const response = await api.post('/api/notes', noteData);
      console.log('✅ Note created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating note:', error);
      throw error;
    }
  },

  getAll: async () => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for notes');
      return Promise.resolve(dummyData.notes || []);
    }
    console.log('🌐 Fetching all notes from API');
    try {
      const response = await api.get(`/api/notes?_t=${Date.now()}`);
      console.log('✅ Notes from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching notes:', error);
      throw error;
    }
  },

  getByStudent: async (studentId) => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for notes');
      return Promise.resolve((dummyData.notes || []).filter(n => n.studentId === studentId));
    }
    console.log(`🌐 Fetching notes for student ${studentId}`);
    try {
      const response = await api.get(`/api/notes/student/${studentId}?_t=${Date.now()}`);
      console.log('✅ Student notes from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching student notes:', error);
      throw error;
    }
  },

  getByCourse: async (courseId) => {
    if (USE_DUMMY_DATA) {
      console.log('📦 Using dummy data for notes');
      return Promise.resolve((dummyData.notes || []).filter(n => n.courseId === courseId));
    }
    console.log(`🌐 Fetching notes for course ${courseId}`);
    try {
      const response = await api.get(`/api/notes/course/${courseId}?_t=${Date.now()}`);
      console.log('✅ Course notes from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching course notes:', error);
      throw error;
    }
  }
};

export default api;
