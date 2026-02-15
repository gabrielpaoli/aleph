// src/services/dummyData.js

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  HALF_ABSENT: 'half_absent'
};

export const dummyData = {
  schools: [
    { id: 1, name: 'escuela1' },
    { id: 2, name: 'escuela2' }
  ],

  courses: [
    { id: 1, name: '1A', shift: 'Tarde', schoolId: 1 },
    { id: 2, name: '1B', shift: 'Mañana', schoolId: 1 },
    { id: 3, name: '2A', shift: 'Tarde', schoolId: 1 },
    { id: 4, name: '2B', shift: 'Mañana', schoolId: 1 },
    { id: 5, name: '1A', shift: 'Tarde', schoolId: 2 },
    { id: 6, name: '1B', shift: 'Mañana', schoolId: 2 }
  ],

  subjects: [
    { id: 1, name: 'Matemáticas', courseId: 1 },
    { id: 2, name: 'Lengua', courseId: 1 },
    { id: 3, name: 'Historia', courseId: 1 },
    { id: 4, name: 'Geografía', courseId: 1 },
    { id: 5, name: 'Inglés', courseId: 1 },
    { id: 6, name: 'Matemáticas', courseId: 2 },
    { id: 7, name: 'Lengua', courseId: 2 },
    { id: 8, name: 'Ciencias Naturales', courseId: 2 },
    { id: 9, name: 'Matemáticas', courseId: 3 },
    { id: 10, name: 'Física', courseId: 3 },
    { id: 11, name: 'Química', courseId: 3 }
  ],

  students: [
    { id: 1, firstName: 'Juan', lastName: 'Pérez', email: 'padre.perez@email.com', courseId: 1, parentId: 1 },
    { id: 2, firstName: 'María', lastName: 'González', email: 'padre.gonzalez@email.com', courseId: 1, parentId: 2 },
    { id: 3, firstName: 'Carlos', lastName: 'Rodríguez', email: 'padre.rodriguez@email.com', courseId: 1, parentId: 3 },
    { id: 4, firstName: 'Ana', lastName: 'Martínez', email: 'padre.martinez@email.com', courseId: 1, parentId: 4 },
    { id: 5, firstName: 'Luis', lastName: 'López', email: 'padre.lopez@email.com', courseId: 1, parentId: 5 },
    { id: 6, firstName: 'Sofia', lastName: 'Fernández', email: 'padre.fernandez@email.com', courseId: 2, parentId: 6 },
    { id: 7, firstName: 'Diego', lastName: 'García', email: 'padre.garcia@email.com', courseId: 2, parentId: 7 },
    { id: 8, firstName: 'Valentina', lastName: 'Sánchez', email: 'padre.sanchez@email.com', courseId: 2, parentId: 8 },
    { id: 9, firstName: 'Mateo', lastName: 'Romero', email: 'padre.romero@email.com', courseId: 3, parentId: 9 },
    { id: 10, firstName: 'Emma', lastName: 'Torres', email: 'padre.torres@email.com', courseId: 3, parentId: 10 }
  ],

  teachers: [],

  grades: [
    // Estudiante 1 - Juan Pérez (fechas en 2026)
    { id: 1, studentId: 1, subjectId: 1, grade: 8, date: '2026-03-15' },
    { id: 2, studentId: 1, subjectId: 1, grade: 9, date: '2026-04-20' },
    { id: 3, studentId: 1, subjectId: 1, grade: 7, date: '2026-05-10' },
    { id: 4, studentId: 1, subjectId: 2, grade: 7, date: '2026-03-18' },
    { id: 5, studentId: 1, subjectId: 2, grade: 8, date: '2026-04-22' },
    { id: 6, studentId: 1, subjectId: 3, grade: 9, date: '2026-03-20' },
    { id: 7, studentId: 1, subjectId: 3, grade: 8, date: '2026-05-15' },
    { id: 8, studentId: 1, subjectId: 4, grade: 6, date: '2026-03-25' },
    { id: 9, studentId: 1, subjectId: 5, grade: 9, date: '2026-04-10' },

    // Estudiante 2 - María González
    { id: 10, studentId: 2, subjectId: 1, grade: 10, date: '2026-03-15' },
    { id: 11, studentId: 2, subjectId: 1, grade: 9, date: '2026-04-20' },
    { id: 12, studentId: 2, subjectId: 2, grade: 9, date: '2026-03-18' },
    { id: 13, studentId: 2, subjectId: 2, grade: 10, date: '2026-04-22' },
    { id: 14, studentId: 2, subjectId: 3, grade: 8, date: '2026-03-20' },
    { id: 15, studentId: 2, subjectId: 4, grade: 9, date: '2026-03-25' },
    { id: 16, studentId: 2, subjectId: 5, grade: 10, date: '2026-04-10' },

    // Estudiante 3 - Carlos Rodríguez
    { id: 17, studentId: 3, subjectId: 1, grade: 6, date: '2026-03-15' },
    { id: 18, studentId: 3, subjectId: 1, grade: 7, date: '2026-04-20' },
    { id: 19, studentId: 3, subjectId: 2, grade: 5, date: '2026-03-18' },
    { id: 20, studentId: 3, subjectId: 3, grade: 7, date: '2026-03-20' },

    // Más estudiantes...
    { id: 21, studentId: 4, subjectId: 1, grade: 8, date: '2026-03-15' },
    { id: 22, studentId: 4, subjectId: 2, grade: 9, date: '2026-03-18' },
    { id: 23, studentId: 5, subjectId: 1, grade: 7, date: '2026-03-15' },
    { id: 24, studentId: 5, subjectId: 2, grade: 8, date: '2026-03-18' }
  ],

  attendance: generateAttendanceData(),

  subjectEnrollments: [],

  users: [
    { id: 1, email: 'preceptor@escuela1.com', role: 'preceptor', schoolId: 1 },
    { id: 2, email: 'preceptor@escuela2.com', role: 'preceptor', schoolId: 2 },
    { id: 3, email: 'admin@escuela1.com', role: 'admin', schoolId: 1 },
    { id: 4, email: 'padre.perez@email.com', role: 'parent', studentId: 1 },
    { id: 5, email: 'padre.gonzalez@email.com', role: 'parent', studentId: 2 },
    { id: 6, email: 'padre.rodriguez@email.com', role: 'parent', studentId: 3 },
    { id: 7, email: 'padre.martinez@email.com', role: 'parent', studentId: 4 },
    { id: 8, email: 'padre.lopez@email.com', role: 'parent', studentId: 5 }
  ]
};

// Función para generar datos de asistencia desde marzo 2026
function generateAttendanceData() {
  const attendance = [];
  const today = new Date(2026, 11, 31); // 31 de diciembre 2026
  const startDate = new Date(2026, 2, 1); // 1 de marzo 2026

  let id = 1;

  // Para cada estudiante
  for (let studentId = 1; studentId <= 10; studentId++) {
    let currentDate = new Date(startDate);

    // Generar asistencias día por día
    while (currentDate <= today) {
      // Solo días de semana
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // 80% presente, 15% ausente, 5% media falta
        const rand = Math.random();
        let status;
        if (rand < 0.80) {
          status = ATTENDANCE_STATUS.PRESENT;
        } else if (rand < 0.95) {
          status = ATTENDANCE_STATUS.ABSENT;
        } else {
          status = ATTENDANCE_STATUS.HALF_ABSENT;
        }

        attendance.push({
          id: id++,
          studentId,
          date: dateStr,
          status
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return attendance;
}
