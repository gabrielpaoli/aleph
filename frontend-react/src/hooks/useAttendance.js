// hooks/useAttendance.js

import { useState, useEffect } from 'react';
import { attendanceService } from '../services/api';

export const useAttendance = (courseId, year, month) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAttendance();
  }, [courseId, year, month]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getByCourseAndMonth(courseId, year, month);
      setAttendance(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (studentId, date, status) => {
    try {
      const existing = attendance.find(
        a => a.studentId === studentId && a.date === date
      );

      if (existing) {
        await attendanceService.update(existing.id, { ...existing, status });
      } else {
        await attendanceService.create({ studentId, date, status });
      }

      await loadAttendance();
    } catch (err) {
      setError(err.message);
    }
  };

  const bulkUpdateAttendance = async (attendanceArray) => {
    try {
      await attendanceService.bulkUpdate(attendanceArray);
      await loadAttendance();
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    attendance,
    loading,
    error,
    updateAttendance,
    bulkUpdateAttendance,
    reload: loadAttendance
  };
};
