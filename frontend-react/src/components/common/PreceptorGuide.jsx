// components/common/PreceptorGuide.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const sections = [
  {
    id: 'asistencias',
    icon: '📋',
    title: 'Registro de Asistencias',
    color: 'indigo',
    subsections: [
      {
        title: 'Cómo registrar asistencia',
        steps: [
          'Hacé clic en "📋 Asistencias" en la barra de navegación.',
          'Seleccioná el curso en el menú desplegable "Seleccionar curso".',
          'Elegí el mes y el año que querés visualizar.',
          'Verás una grilla con todos los estudiantes del curso en las filas y los días del mes en las columnas.',
          'Hacé clic en la celda correspondiente al estudiante y al día para cambiar su estado de asistencia.',
          'Cuando termines de registrar, hacé clic en "💾 Guardar cambios" para aplicar las modificaciones.',
          'Si querés descartar los cambios, usá el botón "↩ Cancelar".',
        ],
      },
      {
        title: 'Estados de asistencia',
        table: [
          { symbol: '✅ P', meaning: 'Presente', color: 'green' },
          { symbol: '❌ A', meaning: 'Ausente', color: 'red' },
          { symbol: '🕐 T', meaning: 'Tardanza', color: 'yellow' },
          { symbol: '🏠 JA', meaning: 'Justificada / Ausencia con aviso', color: 'blue' },
          { symbol: '—', meaning: 'Sin registrar', color: 'gray' },
        ],
      },
      {
        title: 'Vista anual y estadísticas',
        steps: [
          'Dentro de la pantalla de asistencias, hacé clic en la pestaña "📊 Resumen anual".',
          'Verás el total de ausencias, tardanzas y presentismo de cada estudiante durante el año.',
          'La pestaña "🏫 Todos los cursos" muestra el resumen comparativo entre todos los cursos.',
          'Los días de fin de semana y las fechas excluidas (feriados) aparecen sombreados y no pueden editarse.',
        ],
      },
    ],
  },
  {
    id: 'notificaciones',
    icon: '📧',
    title: 'Notificación de Ausencias',
    color: 'rose',
    subsections: [
      {
        title: 'Enviar emails a padres',
        steps: [
          'Hacé clic en "📧 Notificaciones" en la barra de navegación.',
          'Seleccioná la fecha que querés consultar usando el campo "Fecha".',
          'Opcionalmente, filtrá por curso usando el selector correspondiente.',
          'El sistema cargará automáticamente la lista de estudiantes ausentes en esa fecha.',
          'Podés marcar o desmarcar individualmente a qué padres notificar, o usar "✅ Seleccionar todos".',
          'Hacé clic en "📧 Enviar Emails" para enviar la notificación por correo electrónico a los padres seleccionados.',
          'Una confirmación te pedirá que verifiques antes de enviar.',
        ],
      },
      {
        title: 'Enviar mensajes por WhatsApp',
        steps: [
          'Si la integración con WhatsApp está activa, verás el botón "💬 Enviar WhatsApp" además del de email.',
          'El proceso es el mismo: seleccioná los estudiantes y enviá.',
          'El mensaje incluye automáticamente el nombre del alumno y la fecha de la ausencia.',
          'Si WhatsApp no está disponible, el botón aparecerá deshabilitado.',
        ],
      },
      {
        title: 'Vista previa del mensaje',
        steps: [
          'Antes de enviar podés ver el asunto y cuerpo del email haciendo clic en "👁 Vista previa del email".',
          'El mensaje se personaliza con el nombre del alumno, la fecha y los datos del colegio.',
        ],
      },
    ],
  },
  {
    id: 'administracion',
    icon: '⚙️',
    title: 'Panel de Administración',
    color: 'purple',
    subsections: [
      {
        title: 'Acceder al panel',
        steps: [
          'Hacé clic en "⚙️ Administración" en la barra de navegación.',
          'Verás un menú de pestañas en la parte superior con todas las secciones disponibles.',
        ],
      },
      {
        title: '👨‍🎓 Estudiantes',
        steps: [
          'Aquí podés buscar, crear, editar y dar de baja estudiantes.',
          'Usá la barra de búsqueda para filtrar por nombre, apellido o curso.',
          'Para crear un nuevo estudiante, hacé clic en "➕ Nuevo estudiante" y completá el formulario.',
          'Para editar, hacé clic en el ícono ✏️ en la fila del estudiante.',
          'Podés ver el perfil completo haciendo clic en el nombre del estudiante.',
        ],
      },
      {
        title: '📚 Cursos',
        steps: [
          'Administrá los cursos del colegio (ej: 1° A Mañana, 2° B Tarde).',
          'Podés buscar cursos por nombre o turno usando la barra de búsqueda.',
          'Para crear un curso, hacé clic en "➕ Nuevo curso" e ingresá el año, la división y el turno.',
          'Para editar o eliminar, usá los íconos ✏️ y 🗑️ en la tabla.',
        ],
      },
      {
        title: '📖 Materias',
        steps: [
          'Gestioná las materias asociadas a cada curso.',
          'Podés filtrar por nombre de materia o por curso.',
          'Al crear una materia, podés asignarle un docente responsable.',
          'Cada materia pertenece a un único curso.',
        ],
      },
      {
        title: '⭐ Calificaciones',
        steps: [
          'Registrá y consultá las notas de los estudiantes.',
          'Filtros disponibles: curso, materia, período (trimestre) y estudiante.',
          'Podés ingresar notas individuales o gestionar calificaciones por trimestre.',
          'Las calificaciones se guardan y son visibles para el docente de la materia y los padres.',
        ],
      },
      {
        title: '👨‍🏫 Docentes',
        steps: [
          'Creá y editá los docentes del colegio.',
          'Cada docente tiene nombre, apellido, email y las materias asignadas.',
          'Podés buscar y filtrar por nombre, curso o materia.',
          'Al crear un docente, se le generan credenciales de acceso al sistema.',
        ],
      },
      {
        title: '👥 Usuarios',
        steps: [
          'Administrá todas las cuentas de usuario del sistema.',
          'Podés ver y gestionar usuarios por rol: preceptor, directivo, padre, docente.',
          'Desde aquí podés activar, desactivar o editar a cualquier usuario.',
        ],
      },
      {
        title: '📝 Notas para estudiantes',
        steps: [
          'Creá notas o comunicados dirigidos a un estudiante individual o a un curso completo.',
          'Para enviar una nota individual: seleccioná "Individual", buscá al estudiante por nombre y completá el título y contenido.',
          'Para enviar a un curso: seleccioná "Por curso" y elegí el curso destinatario.',
          'Las notas son visibles en el perfil del estudiante y pueden notificarse por email o WhatsApp.',
        ],
      },
    ],
  },
  {
    id: 'fechas',
    icon: '📅',
    title: 'Fechas Excluidas (Feriados)',
    color: 'amber',
    subsections: [
      {
        title: 'Qué son las fechas excluidas',
        steps: [
          'Las fechas excluidas son días en los que no se toma asistencia: feriados, actos escolares, etc.',
          'En la grilla de asistencias, esos días aparecen sombreados y no son editables.',
        ],
      },
      {
        title: 'Cómo gestionar fechas excluidas',
        steps: [
          'Dentro del Panel de Administración, buscá la sección "Fechas excluidas" (accesible desde la pantalla de asistencias con el botón ⚙️).',
          'Seleccioná el año que querés gestionar.',
          'Para agregar un feriado: ingresá la fecha y una descripción (ej: "Feriado nacional") y hacé clic en "Agregar".',
          'Para eliminar una fecha excluida, hacé clic en el ícono 🗑️ junto a la fecha.',
          'Los cambios se reflejan inmediatamente en la grilla de asistencias.',
        ],
      },
    ],
  },
  {
    id: 'perfil',
    icon: '👤',
    title: 'Mi Perfil',
    color: 'teal',
    subsections: [
      {
        title: 'Ver y actualizar el perfil',
        steps: [
          'Hacé clic en "⚙️ Mi Perfil" en la esquina superior derecha de la pantalla.',
          'Verás tu correo electrónico y rol actual en la sección "Información de la cuenta".',
        ],
      },
      {
        title: 'Cambiar contraseña',
        steps: [
          'En la sección "🔒 Cambiar contraseña", ingresá tu contraseña actual.',
          'A continuación, ingresá la nueva contraseña (mínimo 6 caracteres) y confirmála.',
          'Hacé clic en "Guardar nueva contraseña".',
          'Si la contraseña actual es incorrecta, el sistema te avisará con un mensaje de error.',
        ],
      },
    ],
  },
  {
    id: 'tips',
    icon: '💡',
    title: 'Consejos y Buenas Prácticas',
    color: 'emerald',
    subsections: [
      {
        title: 'Recomendaciones generales',
        steps: [
          'Registrá la asistencia al inicio de cada clase para mantener el registro actualizado.',
          'Guardá siempre los cambios antes de cambiar de curso o de mes.',
          'Antes de enviar notificaciones de ausencia, verificá la lista de seleccionados.',
          'Cargá los feriados y días no lectivos al comienzo del ciclo escolar para evitar errores en los registros.',
          'Si necesitás corregir una asistencia ya guardada, volvé al mes correspondiente y editá el día.',
          'Usá la vista anual al final de cada trimestre para revisar el presentismo general del curso.',
          'Cerrá sesión cuando termines de usar el sistema en equipos compartidos ("Salir" en la barra superior).',
        ],
      },
    ],
  },
];

const colorMap = {
  indigo: {
    header: 'bg-indigo-50 border-indigo-200',
    title: 'text-indigo-700',
    icon: 'bg-indigo-100 text-indigo-600',
    dot: 'bg-indigo-400',
    nav: 'text-indigo-600 hover:bg-indigo-50',
    navActive: 'bg-indigo-100 text-indigo-700 font-semibold',
  },
  rose: {
    header: 'bg-rose-50 border-rose-200',
    title: 'text-rose-700',
    icon: 'bg-rose-100 text-rose-600',
    dot: 'bg-rose-400',
    nav: 'text-rose-600 hover:bg-rose-50',
    navActive: 'bg-rose-100 text-rose-700 font-semibold',
  },
  purple: {
    header: 'bg-purple-50 border-purple-200',
    title: 'text-purple-700',
    icon: 'bg-purple-100 text-purple-600',
    dot: 'bg-purple-400',
    nav: 'text-purple-600 hover:bg-purple-50',
    navActive: 'bg-purple-100 text-purple-700 font-semibold',
  },
  amber: {
    header: 'bg-amber-50 border-amber-200',
    title: 'text-amber-700',
    icon: 'bg-amber-100 text-amber-600',
    dot: 'bg-amber-400',
    nav: 'text-amber-600 hover:bg-amber-50',
    navActive: 'bg-amber-100 text-amber-700 font-semibold',
  },
  teal: {
    header: 'bg-teal-50 border-teal-200',
    title: 'text-teal-700',
    icon: 'bg-teal-100 text-teal-600',
    dot: 'bg-teal-400',
    nav: 'text-teal-600 hover:bg-teal-50',
    navActive: 'bg-teal-100 text-teal-700 font-semibold',
  },
  emerald: {
    header: 'bg-emerald-50 border-emerald-200',
    title: 'text-emerald-700',
    icon: 'bg-emerald-100 text-emerald-600',
    dot: 'bg-emerald-400',
    nav: 'text-emerald-600 hover:bg-emerald-50',
    navActive: 'bg-emerald-100 text-emerald-700 font-semibold',
  },
};

const PreceptorGuide = () => {
  const [activeSection, setActiveSection] = useState('asistencias');

  const section = sections.find(s => s.id === activeSection);
  const c = colorMap[section.color];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">📘</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Guía de Usuario — Preceptor
          </h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Manual completo de todas las funcionalidades disponibles para el rol de Preceptor.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar navigation */}
        <aside className="lg:w-60 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sticky top-6">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold px-2 mb-2">
              Secciones
            </p>
            <nav className="space-y-1">
              {sections.map(s => {
                const sc = colorMap[s.color];
                const isActive = s.id === activeSection;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? sc.navActive : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    {s.title}
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold px-2 mb-2">
                Accesos rápidos
              </p>
              <Link
                to="/asistencias"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                📋 Ir a Asistencias
              </Link>
              <Link
                to="/notificaciones"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                📧 Ir a Notificaciones
              </Link>
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ⚙️ Ir al Panel Admin
              </Link>
              <Link
                to="/perfil"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                👤 Ir a Mi Perfil
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Section header */}
          <div className={`flex items-center gap-4 p-5 rounded-2xl border mb-6 ${c.header}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${c.icon}`}>
              {section.icon}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${c.title}`}>{section.title}</h2>
              <p className="text-slate-500 text-sm mt-0.5">
                {section.subsections.length} {section.subsections.length === 1 ? 'apartado' : 'apartados'}
              </p>
            </div>
          </div>

          {/* Subsections */}
          <div className="space-y-5">
            {section.subsections.map((sub, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6"
              >
                <h3 className="font-semibold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold flex-shrink-0 ${c.dot}`}>
                    {idx + 1}
                  </span>
                  {sub.title}
                </h3>

                {/* Steps list */}
                {sub.steps && (
                  <ol className="space-y-2">
                    {sub.steps.map((step, si) => (
                      <li key={si} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 text-white ${c.dot}`}>
                          {si + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {/* Optional table (for attendance statuses) */}
                {sub.table && (
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left px-4 py-2 font-semibold text-slate-600 border border-slate-200 rounded-tl-lg">
                            Símbolo / Código
                          </th>
                          <th className="text-left px-4 py-2 font-semibold text-slate-600 border border-slate-200 rounded-tr-lg">
                            Significado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sub.table.map((row, ri) => {
                          const rowColors = {
                            green: 'bg-emerald-50 text-emerald-700',
                            red: 'bg-rose-50 text-rose-700',
                            yellow: 'bg-amber-50 text-amber-700',
                            blue: 'bg-blue-50 text-blue-700',
                            gray: 'bg-slate-50 text-slate-500',
                          };
                          return (
                            <tr key={ri} className="border-b border-slate-100 last:border-0">
                              <td className={`px-4 py-2 font-mono font-semibold border border-slate-200 ${rowColors[row.color]}`}>
                                {row.symbol}
                              </td>
                              <td className="px-4 py-2 text-slate-700 border border-slate-200">
                                {row.meaning}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            {sections.findIndex(s => s.id === activeSection) > 0 ? (
              <button
                onClick={() => setActiveSection(sections[sections.findIndex(s => s.id === activeSection) - 1].id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-colors"
              >
                ← {sections[sections.findIndex(s => s.id === activeSection) - 1].title}
              </button>
            ) : <div />}

            {sections.findIndex(s => s.id === activeSection) < sections.length - 1 ? (
              <button
                onClick={() => setActiveSection(sections[sections.findIndex(s => s.id === activeSection) + 1].id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm transition-colors shadow-sm"
              >
                {sections[sections.findIndex(s => s.id === activeSection) + 1].title} →
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
                ✅ Fin de la guía
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PreceptorGuide;
