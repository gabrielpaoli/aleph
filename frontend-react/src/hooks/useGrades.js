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
        // Forzar a traer de Drupal, no de dummy data
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/grades?studentId=${studentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        data = await response.json();
      } else {
        console.log('📥 Cargando todas las calificaciones de Drupal');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/grades`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        data = await response.json();
      }

      console.log('✅ Calificaciones cargadas de Drupal:', data);
      setGrades(data || []);
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
