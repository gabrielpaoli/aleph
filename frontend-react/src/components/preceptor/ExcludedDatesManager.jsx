// components/preceptor/ExcludedDatesManager.jsx

import React, { useState, useEffect } from 'react';
import { excludedDateService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ExcludedDatesManager = () => {
  const { user } = useAuth();
  const [excludedDates, setExcludedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Formatea una fecha ISO 'YYYY-MM-DD' como fecha local sin desfase horario
  const formatISODateLocal = (iso) => {
    if (!iso) return '';
    const parts = String(iso).split('-').map(Number);
    if (parts.length !== 3) return iso;
    const [y, m, d] = parts;
    try {
      return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
    } catch (e) {
      return iso;
    }
  };

  // Cargar días excluidos
  const loadExcludedDates = async (page = 1, year = selectedYear) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📅 Loading excluded dates (page ${page})...`);
      
      const response = await excludedDateService.getAll(page, 50, year);
      
      setExcludedDates(response.items || []);
      setTotalPages(response.pages || 1);
      setCurrentPage(response.page || 1);
      console.log('✅ Excluded dates loaded:', response.items?.length);
    } catch (err) {
      console.error('❌ Error loading excluded dates:', err);
      setError('Error al cargar los días excluidos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    loadExcludedDates(1, selectedYear);
  }, [selectedYear]);

  // Crear nuevo día excluido
  const handleAddDate = async (e) => {
    e.preventDefault();

    if (!newDate) {
      setError('Debe seleccionar una fecha');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      console.log('📝 Creating excluded date:', newDate);

      await excludedDateService.create({
        date: newDate,
        reason: newReason,
      });

      setSuccessMessage(`Día ${newDate} excluido exitosamente`);
      setNewDate('');
      setNewReason('');
      setShowForm(false);

      // Recargar lista (respetando el año seleccionado)
      loadExcludedDates(1, selectedYear);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('❌ Error creating excluded date:', err);
      if (err.response?.status === 409) {
        setError('Ese día ya está excluido');
      } else {
        setError('Error al excluir el día');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar día excluido
  const handleDeleteDate = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este día excluido?')) {
      return;
    }

    try {
      console.log(`🗑️ Deleting excluded date ${id}...`);
      setError(null);

      await excludedDateService.delete(id);

      setSuccessMessage('Día excluido eliminado exitosamente');

      // Recargar lista (respetando el año seleccionado)
      loadExcludedDates(currentPage, selectedYear);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('❌ Error deleting excluded date:', err);
      setError('Error al eliminar el día excluido');
    }
  };

  // Verificar permisos
  if (!user || (user.role !== 'preceptor' && user.role !== 'directivo')) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">
          No tiene permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Gestión de Días Excluidos
      </h1>

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          ✅ {successMessage}
        </div>
      )}

      {/* Botón para mostrar/ocultar formulario */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showForm
                ? 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {showForm ? 'Cancelar' : '+ Agregar Día Excluido'}
          </button>

          {/* Selector de año para filtrar */}
          <label className="text-sm font-medium text-gray-700">Año:</label>
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            {Array.from({ length: 6 }).map((_, idx) => {
              const y = currentYear - 3 + idx; // rango: currentYear-3 .. currentYear+2
              return (
                <option key={y} value={y}>{y}</option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Formulario para agregar día excluido */}
      {showForm && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Nuevo Día Excluido
          </h2>
          <form onSubmit={handleAddDate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo (opcional)
              </label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ej: Feriado, Jornada Institucional, Huelga, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !newDate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNewDate('');
                  setNewReason('');
                }}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de días excluidos */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Cargando días excluidos...</p>
        </div>
      ) : excludedDates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            No hay días excluidos del calendario. 
            {user.role === 'preceptor' || user.role === 'directivo' ? ' Agregue uno usando el botón anterior.' : ''}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Motivo</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {excludedDates.map((excludedDate) => (
                  <tr
                    key={excludedDate.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-800">
                      {formatISODateLocal(excludedDate.date)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {excludedDate.reason || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteDate(excludedDate.id)}
                        className="inline-block px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => loadExcludedDates(Math.max(1, currentPage - 1), selectedYear)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2 text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => loadExcludedDates(Math.min(totalPages, currentPage + 1), selectedYear)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Información sobre el impacto */}
      <div className="mt-8 p-4 bg-blue-100 border border-blue-300 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
        <p className="text-blue-800 text-sm">
          Los días excluidos aquí se utilizan para evitar generar registros de asistencia en esos días.
          Los sabados y domingos se excluyen automáticamente del calendario.
        </p>
      </div>
    </div>
  );
};

export default ExcludedDatesManager;
