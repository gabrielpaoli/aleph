// components/admin/WhatsappSettings.jsx

import React, { useState, useEffect } from 'react';
import { whatsappService } from '../../services/api';

const WhatsappSettings = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const s = await whatsappService.getStatus();
      setStatus(s);
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-slate-500">⏳ Cargando estado de WhatsApp...</div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-2xl font-bold mb-6 text-slate-800">💬 Configuración de WhatsApp</h3>

      {/* Status card */}
      <div className={`p-5 rounded-xl border-2 mb-6 ${status?.enabled ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{status?.enabled ? '✅' : '⚠️'}</span>
          <span className="font-bold text-lg">
            {status?.enabled ? 'WhatsApp activo para esta escuela' : 'WhatsApp no configurado'}
          </span>
        </div>
        {status?.school_name && (
          <p className="text-slate-700 text-sm">
            🏫 Escuela: <strong>{status.school_name}</strong>
          </p>
        )}
        {status?.enabled && (
          <p className="text-green-700 text-sm mt-1">
            Número de origen configurado: {status.from_number_configured ? '✅' : '❌'}
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h4 className="font-bold text-slate-800 mb-3">⚙️ Cómo configurar</h4>
        <p className="text-slate-600 text-sm mb-4">
          La configuración de WhatsApp se realiza desde el panel de administración de Drupal.
          Cada escuela tiene su propio conjunto de credenciales de Twilio.
        </p>

        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
          <li>Ingresar al panel Drupal como administrador.</li>
          <li>
            Ir a <strong>Configuración → Servicios → WhatsApp Notifier</strong>
            <br />
            <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">/admin/config/whatsapp-notifier</code>
          </li>
          <li>Completar los campos:
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-600">
              <li><strong>Account SID</strong> — desde <a href="https://console.twilio.com" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">console.twilio.com</a></li>
              <li><strong>Auth Token</strong> — desde la misma consola</li>
              <li><strong>Número de origen</strong> — ej: <code className="text-xs bg-slate-100 px-1 rounded">whatsapp:+14155238886</code></li>
              <li><strong>Nombre de la escuela</strong> — se usa en la firma de los mensajes</li>
            </ul>
          </li>
          <li>Guardar y volver a esta pantalla para verificar el estado.</li>
        </ol>

        <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>📋 Sandbox de Twilio (sin costo):</strong> Para pruebas, usa el número
          <code className="mx-1 bg-blue-100 px-1 rounded">whatsapp:+14155238886</code>
          y pide a los padres que envíen el código de unión al sandbox antes de recibir mensajes.
          <br />
          Más info: <a href="https://www.twilio.com/docs/whatsapp/sandbox" className="underline" target="_blank" rel="noopener noreferrer">twilio.com/docs/whatsapp/sandbox</a>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={loadStatus}
          className="px-5 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
        >
          🔄 Actualizar estado
        </button>
      </div>
    </div>
  );
};

export default WhatsappSettings;
