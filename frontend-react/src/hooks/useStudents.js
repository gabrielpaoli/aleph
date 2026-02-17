// hooks/useStudents.js (continuación)

import { useState, useEffect } from 'react';
import { studentService } from '../services/api';

export const useStudents = (courseId = null) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStudents();
  }, [courseId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentService.getAll();
      const filtered = courseId
        ? data.filter(s => s.courseId === courseId)
        : data;
      setStudents(filtered);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (studentData) => {
    try {
      await studentService.create(studentData);
      await loadStudents();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStudent = async (id, studentData) => {
    try {
      await studentService.update(id, studentData);
      await loadStudents();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStudent = async (id) => {
    try {
      await studentService.delete(id);
      await loadStudents();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    students,
    loading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
    reload: loadStudents
  };
};
