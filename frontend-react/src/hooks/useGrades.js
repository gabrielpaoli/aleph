// hooks/useGrades.js

import { useState, useEffect, useCallback } from 'react';
import { gradeService } from '../services/api';

/**
 * Custom hook para obtener y gestionar calificaciones desde Drupal
 * @param {number} studentId - ID del estudiante (opcional)
 * @returns {Object} - { grades, loading, error, refresh }
 */
export const useGrades = (studentId = null) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data = [];
      
      if (studentId) {
        console.log(`📥 Cargando calificaciones de Drupal para estudiante ${studentId}`);
        // Usar el servicio de API directamente
        data = await gradeService.getByStudent(studentId);
      } else {
        console.log('📥 Cargando todas las calificaciones de Drupal');
        // Usar el servicio de API directamente
        data = await gradeService.getAll();
      }

      const items = Array.isArray(data) ? data : (data?.items || []);
      console.log('✅ Calificaciones cargadas de Drupal:', items);
      setGrades(items);
    } catch (err) {
      console.error('❌ Error cargando calificaciones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // Cargar calificaciones cuando cambia studentId
  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  // Función para recargar manualmente
  const refresh = useCallback(() => {
    console.log('🔄 Recargando calificaciones desde Drupal...');
    loadGrades();
  }, [loadGrades]);

  return { grades, loading, error, refresh };
};

export default useGrades;
