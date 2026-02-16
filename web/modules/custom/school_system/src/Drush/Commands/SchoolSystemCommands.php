<?php

namespace Drupal\school_system\Drush\Commands;

use Drush\Commands\DrushCommands;
use Drush\Attributes as CLI;
use Drupal\node\Entity\Node;
use Drupal\user\Entity\User;

/**
 * Drush commands for School System.
 */
class SchoolSystemCommands extends DrushCommands {

  /**
   * Generate dummy data matching React frontend.
   */
  #[CLI\Command(name: 'school-system:generate-data', aliases: ['ss:gen'])]
  #[CLI\Usage(name: 'drush school-system:generate-data', description: 'Generate dummy data for School System')]
  /**
   * Count the number of nodes in the Drupal site.
   *
   * @command school-system:generate-data
   * @aliases ss:gen
   * @usage school-system:generate-data
   *   Generate dummy data for School System
   */
  public function generateData() {
    $this->output()->writeln('🚀 Generating dummy data matching React frontend...');
    $this->output()->writeln('');

    // Limpiar datos existentes
    $this->cleanExistingData();

    // Crear cursos suficientes para 50 estudiantes (máximo 24 por curso)
    $this->output()->writeln('📖 Creating courses...');
    $max_students_per_course = 24;
    $total_students = 50;
    $courses_needed = ceil($total_students / $max_students_per_course); // Aproximadamente 21 cursos
    
    $courses = [];
    $course_letters = ['A', 'B'];
    $shifts = ['Mañana', 'Tarde', 'Noche'];
    $course_index = 0;

    foreach ($shifts as $shift) {
      for ($year = 1; $year <= 5 && $course_index < $courses_needed; $year++) {
        foreach ($course_letters as $letter) {
          if ($course_index >= $courses_needed) {
            break 3;
          }

          $course_name = "{$year}{$letter}";
          $courses[] = [
            'id' => $this->createCourse($course_name, $shift),
            'name' => $course_name,
            'shift' => $shift,
            'student_count' => 0,
          ];
          $course_index++;
        }
      }
    }
    
    $this->output()->writeln("   Created " . count($courses) . " courses");

    $this->output()->writeln("   Created " . count($courses) . " courses");

    // Crear materias para los primeros cursos
    $this->output()->writeln('📝 Creating subjects...');
    $subject_names = ['Matemáticas', 'Lengua', 'Historia', 'Geografía', 'Inglés', 'Ciencias Naturales', 'Física', 'Química'];
    $all_subjects = [];
    
    // Crear materias para los primeros 4 cursos
    for ($i = 0; $i < min(4, count($courses)); $i++) {
      foreach ($subject_names as $subject_name) {
        $all_subjects[] = $this->createSubject($subject_name, $courses[$i]['id']);
      }
    }
    
    $this->output()->writeln("   Created " . count($all_subjects) . " subjects");

    $this->output()->writeln("   Created " . count($all_subjects) . " subjects");

    // Crear estudiantes y asignarlos a cursos (máximo 24 por curso)
    $this->output()->writeln('👨‍🎓 Creating students...');
    $students = [];
    $current_course_index = 0;
    
    // Primeros 10 estudiantes con nombres específicos
    $initial_students = [
      ['Juan', 'Pérez', 'padre.perez@email.com'],
      ['María', 'González', 'padre.gonzalez@email.com'],
      ['Carlos', 'Rodríguez', 'padre.rodriguez@email.com'],
      ['Ana', 'Martínez', 'padre.martinez@email.com'],
      ['Luis', 'López', 'padre.lopez@email.com'],
      ['Sofia', 'Fernández', 'padre.fernandez@email.com'],
      ['Diego', 'García', 'padre.garcia@email.com'],
      ['Valentina', 'Sánchez', 'padre.sanchez@email.com'],
      ['Mateo', 'Romero', 'padre.romero@email.com'],
      ['Emma', 'Torres', 'padre.torres@email.com'],
    ];
    
    for ($i = 0; $i < count($initial_students); $i++) {
      // Buscar curso con espacio disponible
      while ($courses[$current_course_index]['student_count'] >= $max_students_per_course) {
        $current_course_index++;
      }
      
      $student_data = $initial_students[$i];
      $student = $this->createStudent(
        $student_data[0], 
        $student_data[1], 
        $student_data[2], 
        $courses[$current_course_index]['id'], 
        $i + 1
      );
      $students[] = $student;
      $courses[$current_course_index]['student_count']++;
    }

    // Generar 490 estudiantes adicionales
    $nombres = ['Lucas', 'Martina', 'Santiago', 'Valentina', 'Mateo', 'Emma', 'Benjamín', 'Isabella', 'Nicolás', 'Mía', 'Sebastián', 'Sofía', 'Joaquín', 'Olivia', 'Tomás', 'Catalina', 'Agustín', 'Emilia', 'Felipe', 'Abril'];
    $apellidos = ['González', 'Rodríguez', 'Martínez', 'López', 'Fernández', 'García', 'Sánchez', 'Romero', 'Torres', 'Díaz', 'Morales', 'Álvarez', 'Gómez', 'Ruiz', 'Pérez', 'Hernández', 'Castro', 'Vargas', 'Silva', 'Ramos'];

    for ($i = 11; $i <= 50; $i++) {
      // Buscar curso con espacio disponible
      while ($current_course_index < count($courses) && $courses[$current_course_index]['student_count'] >= $max_students_per_course) {
        $current_course_index++;
      }
      
      if ($current_course_index >= count($courses)) {
        $this->output()->writeln("   Warning: Not enough courses for all students!");
        break;
      }
      
      $nombre = $nombres[($i - 1) % count($nombres)];
      $apellido = $apellidos[($i - 1) % count($apellidos)];
      $email = "padre.estudiante{$i}@email.com";
      
      $student = $this->createStudent(
        $nombre, 
        $apellido, 
        $email, 
        $courses[$current_course_index]['id'], 
        $i
      );
      $students[] = $student;
      $courses[$current_course_index]['student_count']++;
    }

    $this->output()->writeln("   Created " . count($students) . " students");
    
    // Mostrar distribución de estudiantes por curso
    $this->output()->writeln('');
    $this->output()->writeln('📊 Student distribution:');
    foreach ($courses as $course) {
      if ($course['student_count'] > 0) {
        $this->output()->writeln("   Course {$course['name']} ({$course['shift']}): {$course['student_count']} students");
      }
    }
    $this->output()->writeln('');

    // Crear docentes
    $this->output()->writeln('👨‍🏫 Creating teachers (as users with docente role)...');

    // Crear usuarios
    $this->output()->writeln('👤 Creating users...');
    $this->createUser('admin@escuela1.com', '1234', 'administrator');
    $this->createUser('preceptor@escuela1.com', '1234', 'preceptor');
    $this->createUser('preceptor@escuela2.com', '1234', 'preceptor');
    
    // Crear directivo
    $this->createUser('directivo@escuela1.com', '1234', 'directivo');
    
    // Crear docentes con materias asignadas (usar las primeras materias creadas)
    if (!empty($all_subjects)) {
      $this->createUser('roberto.diaz@escuela1.com', '1234', 'docente', [
        $all_subjects[0], // Primera materia
        $all_subjects[1], // Segunda materia
      ]);
      $this->createUser('laura.morales@escuela1.com', '1234', 'docente', [
        $all_subjects[2], // Tercera materia
        $all_subjects[3], // Cuarta materia
      ]);
    }

    foreach ($students as $student) {
      $email = $student->get('field_parent_email')->value;
      $this->createUser($email, '1234', 'parent');
    }

    $this->output()->writeln('   Created ' . count($students) . ' parent users');

    // Crear días excluidos PRIMERO (antes de generar asistencias)
    $this->output()->writeln('📆 Creating excluded dates...');
    $this->createExcludedDates();

    // Crear notas
    $this->output()->writeln('📊 Creating grades...');

    // Crear algunas calificaciones de ejemplo para los primeros estudiantes
    if (!empty($all_subjects) && !empty($students)) {
      // Juan Pérez (estudiante 0)
      $this->createGrade($students[0]->id(), $all_subjects[0], 8, '2026-03-15');
      $this->createGrade($students[0]->id(), $all_subjects[0], 9, '2026-04-20');
      $this->createGrade($students[0]->id(), $all_subjects[1], 7, '2026-03-18');

      // María González (estudiante 1)
      $this->createGrade($students[1]->id(), $all_subjects[0], 10, '2026-03-15');
      $this->createGrade($students[1]->id(), $all_subjects[1], 9, '2026-03-18');
    }

    // Crear asistencias (DESPUÉS de que se hayan creado los días excluidos)
    $this->output()->writeln('📅 Creating attendance records...');
    $this->generateAttendance($students);

    // Crear notas
    $this->output()->writeln('📝 Creating dummy notes...');
    $this->generateNotes($students);

    $this->output()->writeln('');
    $this->output()->writeln('✅ Dummy data generated successfully!');
  }

  /**
   * Create test users only.
   */
  #[CLI\Command(name: 'school-system:create-users', aliases: ['ss:users'])]
  #[CLI\Usage(name: 'drush school-system:create-users', description: 'Create test users for School System')]
  public function createUsers() {
    $this->output()->writeln('👤 Creating test users...');
    $this->output()->writeln('');

    // Crear usuarios administrativos
    $this->output()->writeln('Creating admin user...');
    $this->createUser('admin@escuela1.com', '1234', 'administrator');

    $this->output()->writeln('Creating preceptor users...');
    $this->createUser('preceptor@escuela1.com', '1234', 'preceptor');
    $this->createUser('preceptor@escuela2.com', '1234', 'preceptor');

    $this->output()->writeln('Creating directivo user...');
    $this->createUser('directivo@escuela1.com', '1234', 'directivo');

    $this->output()->writeln('Creating docente users...');
    $this->createUser('roberto.diaz@escuela1.com', '1234', 'docente');
    $this->createUser('laura.morales@escuela1.com', '1234', 'docente');

    $this->output()->writeln('Creating parent users...');
    $this->createUser('padre.perez@email.com', '1234', 'parent');
    $this->createUser('padre.gonzalez@email.com', '1234', 'parent');
    $this->createUser('padre.rodriguez@email.com', '1234', 'parent');
    $this->createUser('padre.martinez@email.com', '1234', 'parent');
    $this->createUser('padre.lopez@email.com', '1234', 'parent');
    $this->createUser('padre.fernandez@email.com', '1234', 'parent');
    $this->createUser('padre.garcia@email.com', '1234', 'parent');
    $this->createUser('padre.sanchez@email.com', '1234', 'parent');
    $this->createUser('padre.romero@email.com', '1234', 'parent');
    $this->createUser('padre.torres@email.com', '1234', 'parent');

    // Generar 490 usuarios de padres adicionales (del 11 al 50)
    for ($i = 11; $i <= 50; $i++) {
      $email = "padre.estudiante{$i}@email.com";
      $this->createUser($email, '1234', 'parent');
    }

    $this->output()->writeln('');
    $this->output()->writeln('✅ Test users created successfully!');
    $this->output()->writeln('');
    $this->output()->writeln('📋 Created users:');
    $this->output()->writeln('   - admin@escuela1.com (admin)');
    $this->output()->writeln('   - preceptor@escuela1.com (preceptor)');
    $this->output()->writeln('   - preceptor@escuela2.com (preceptor)');
    $this->output()->writeln('   - directivo@escuela1.com (directivo)');
    $this->output()->writeln('   - roberto.diaz@escuela1.com (docente)');
    $this->output()->writeln('   - laura.morales@escuela1.com (docente)');
    $this->output()->writeln('   - 50 parent users (padre.*)');
    $this->output()->writeln('');
    $this->output()->writeln('🔑 All passwords: 1234');
  }

  /**
   * Assign 4 random grades with random subjects to each student.
   */
  #[CLI\Command(name: 'school-system:random-grades', aliases: ['ss:random-grades'])]
  #[CLI\Usage(name: 'drush school-system:random-grades', description: 'Assign 4 random grades to each student')]
  public function assignRandomGrades() {
    $this->output()->writeln('🎲 Assigning 4 random grades to each student...');

    $student_ids = \Drupal::entityQuery('node')
      ->condition('type', 'student')
      ->accessCheck(FALSE)
      ->execute();

    $subject_ids = \Drupal::entityQuery('node')
      ->condition('type', 'subject')
      ->accessCheck(FALSE)
      ->execute();

    if (empty($student_ids)) {
      $this->output()->writeln('⚠️ No students found.');
      return;
    }

    if (empty($subject_ids)) {
      $this->output()->writeln('⚠️ No subjects found.');
      return;
    }

    $students = Node::loadMultiple($student_ids);
    $subjects = Node::loadMultiple($subject_ids);

    $subjects_by_course = [];
    foreach ($subjects as $subject) {
      $course_ref = $subject->get('field_course_ref')->target_id ?? NULL;
      if ($course_ref) {
        if (!isset($subjects_by_course[$course_ref])) {
          $subjects_by_course[$course_ref] = [];
        }
        $subjects_by_course[$course_ref][] = (int) $subject->id();
      }
    }

    $count = 0;
    $skipped = 0;
    foreach ($students as $student) {
      $student_id = (int) $student->id();
      $course_id = $student->get('field_course_ref')->target_id ?? NULL;

      if (!$course_id || empty($subjects_by_course[$course_id])) {
        $skipped++;
        continue;
      }

      $available_subjects = $subjects_by_course[$course_id];
      shuffle($available_subjects);
      $selected_subjects = array_slice($available_subjects, 0, min(4, count($available_subjects)));

      while (count($selected_subjects) < 4) {
        $selected_subjects[] = $available_subjects[array_rand($available_subjects)];
      }

      foreach ($selected_subjects as $subject_id) {
        $grade = mt_rand(1, 10);
        $date = $this->getRandomDate('2026-03-01', '2026-12-31');
        $this->createGrade($student_id, $subject_id, $grade, $date);
        $count++;
      }
    }

    $this->output()->writeln("✅ Created $count random grades for " . count($students) . ' students');
    if ($skipped > 0) {
      $this->output()->writeln("⚠️ Skipped $skipped students without subjects for their course");
    }
  }

  /**
   * Delete all grade nodes.
   */
  #[CLI\Command(name: 'school-system:clear-grades', aliases: ['ss:clear-grades'])]
  #[CLI\Usage(name: 'drush school-system:clear-grades', description: 'Delete all grades')]
  public function clearGrades() {
    $this->output()->writeln('🗑️  Deleting all grades...');

    $grade_ids = \Drupal::entityQuery('node')
      ->condition('type', 'grade')
      ->accessCheck(FALSE)
      ->execute();

    if (empty($grade_ids)) {
      $this->output()->writeln('⚠️ No grades found.');
      return;
    }

    $grades = Node::loadMultiple($grade_ids);
    foreach ($grades as $grade) {
      $grade->delete();
    }

    $this->output()->writeln('✅ All grades deleted.');
  }

  /**
   * Clear all data.
   */
  #[CLI\Command(name: 'school-system:clear-data', aliases: ['ss:clear'])]
  public function clearData() {
    $this->output()->writeln('🗑️  Clearing all School System data...');
    $this->cleanExistingData();
    $this->output()->writeln('✅ Data cleared successfully!');
  }

  /**
   * Show statistics.
   */
  #[CLI\Command(name: 'school-system:stats', aliases: ['ss:stats'])]
  public function showStats() {
    $this->output()->writeln('📊 School System Statistics:');
    $this->output()->writeln('');

    $types = [
      'course' => 'Courses',
      'subject' => 'Subjects',
      'student' => 'Students',
      'teacher' => 'Teachers',
      'grade' => 'Grades',
      'attendance' => 'Attendance Records',
      'note' => 'Notes',
    ];

    foreach ($types as $type => $label) {
      $query = \Drupal::entityQuery('node')
        ->condition('type', $type)
        ->accessCheck(FALSE);
      $count = $query->count()->execute();
      $this->output()->writeln("   $label: $count");
    }
  }

  // Métodos privados helper
  private function cleanExistingData() {
    $types = ['attendance', 'grade', 'note', 'student', 'teacher', 'subject', 'course'];

    foreach ($types as $type) {
      $query = \Drupal::entityQuery('node')
        ->condition('type', $type)
        ->accessCheck(FALSE);
      $nids = $query->execute();

      if (!empty($nids)) {
        $nodes = Node::loadMultiple($nids);
        foreach ($nodes as $node) {
          $node->delete();
        }
      }
    }

    // Eliminar usuarios
    $users = \Drupal::entityTypeManager()
      ->getStorage('user')
      ->loadByProperties([]);

    foreach ($users as $user) {
      if ($user->id() > 1) {
        $user->delete();
      }
    }
  }

  private function createCourse($name, $shift) {
    $node = Node::create([
      'type' => 'course',
      'title' => "$name - $shift",
      'field_course_name' => $name,
      'field_shift' => $shift,
      'status' => 1,
    ]);
    $node->save();
    return $node->id();
  }

  private function createSubject($name, $course_id) {
    $node = Node::create([
      'type' => 'subject',
      'title' => $name,
      'field_subject_name' => $name,
      'field_course_ref' => ['target_id' => $course_id],
      'status' => 1,
    ]);
    $node->save();
    return $node->id();
  }

  private function createStudent($first_name, $last_name, $email, $course_id, $student_id) {
    $node = Node::create([
      'type' => 'student',
      'title' => "$first_name $last_name",
      'field_first_name' => $first_name,
      'field_last_name' => $last_name,
      'field_parent_email' => $email,
      'field_course_ref' => ['target_id' => $course_id],
      'field_legajo' => $student_id,
      'status' => 1,
    ]);
    $node->save();
    return $node;
  }

  private function createTeacher($first_name, $last_name, $email, $subject_ids) {
    $subjects_refs = [];
    foreach ($subject_ids as $subject_id) {
      $subjects_refs[] = ['target_id' => $subject_id];
    }

    $node = Node::create([
      'type' => 'teacher',
      'title' => "$first_name $last_name",
      'field_first_name' => $first_name,
      'field_last_name' => $last_name,
      'field_email' => $email,
      'field_subjects_ref' => $subjects_refs,
      'status' => 1,
    ]);
    $node->save();
    return $node;
  }

  private function createGrade($student_id, $subject_id, $grade, $date) {
    $node = Node::create([
      'type' => 'grade',
      'title' => "Grade $date",
      'field_student_ref' => ['target_id' => $student_id],
      'field_subject_ref' => ['target_id' => $subject_id],
      'field_grade_value' => $grade,
      'field_date' => $date,
      'status' => 1,
    ]);
    $node->save();
  }

  private function getRandomDate($start_date, $end_date) {
    $start = strtotime($start_date);
    $end = strtotime($end_date);
    $timestamp = mt_rand($start, $end);
    return date('Y-m-d', $timestamp);
  }

  private function createUser($email, $password, $role, $subject_ids = []) {
    $existing = \Drupal::entityTypeManager()
      ->getStorage('user')
      ->loadByProperties(['mail' => $email]);

    if (!empty($existing)) {
      return;
    }

    $user = User::create([
      'name' => $email,
      'mail' => $email,
      'pass' => $password,
      'status' => 1,
      'roles' => [$role],
    ]);

    // Asignar materias si el rol es docente y hay materias
    if ($role === 'docente' && !empty($subject_ids)) {
      $subjects_refs = [];
      foreach ($subject_ids as $subject_id) {
        $subjects_refs[] = ['target_id' => $subject_id];
      }
      $user->set('field_subjects_ref', $subjects_refs);
    }

    $user->save();
  }

  private function generateAttendance($students) {
    $start_date = new \DateTime('2026-03-01');
    $end_date = new \DateTime('2026-12-31');

    // Load excluded dates
    $excluded_dates = $this->getExcludedDates();
    $excluded_date_strings = [];
    foreach ($excluded_dates as $excluded) {
      $excluded_date_strings[] = $excluded->get('field_excluded_date')->value;
    }

    $current_date = clone $start_date;
    $count = 0;

    while ($current_date <= $end_date) {
      $day_of_week = (int) $current_date->format('N');
      $date_string = $current_date->format('Y-m-d');

      // Skip weekends (Saturday = 6, Sunday = 7)
      if ($day_of_week >= 6) {
        $current_date->modify('+1 day');
        continue;
      }

      // Skip excluded dates
      if (in_array($date_string, $excluded_date_strings)) {
        $current_date->modify('+1 day');
        continue;
      }

      foreach ($students as $student) {
        $rand = mt_rand(1, 100);
        if ($rand <= 80) {
          $status = 'present';
        } elseif ($rand <= 95) {
          $status = 'absent';
        } else {
          $status = 'half_absent';
        }

        $node = Node::create([
          'type' => 'attendance',
          'title' => 'Attendance ' . $date_string,
          'field_student_ref' => ['target_id' => $student->id()],
          'field_date' => $date_string,
          'field_status' => $status,
          'status' => 1,
        ]);
        $node->save();
        $count++;
      }

      $current_date->modify('+1 day');
    }

    $this->output()->writeln("   Created $count attendance records");
  }

  /**
   * Get all excluded dates.
   */
  private function getExcludedDates() {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'excluded_date')
      ->condition('status', 1)
      ->accessCheck(FALSE);

    $nids = $query->execute();
    $excluded_dates = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $excluded_dates[] = $node;
      }
    }

    return $excluded_dates;
  }

  /**
   * Create excluded dates for the year.
   */
  private function createExcludedDates() {
    $excluded_dates = [
      ['2026-02-16', 'Carnaval'],
      ['2026-02-17', 'Carnaval'],
      ['2026-04-02', 'Malvinas Day'],
      ['2026-04-10', 'Good Friday'],
      ['2026-05-01', 'Labour Day'],
      ['2026-05-25', 'National Day'],
      ['2026-06-17', 'Flag Day'],
      ['2026-06-20', 'Winter Solstice'],
      ['2026-07-09', 'Independence Day'],
      ['2026-07-10', 'Independence Day (observed)'],
      ['2026-08-17', 'Death of General San Martín'],
      ['2026-10-12', 'Discovery Day'],
      ['2026-11-02', 'All Souls\' Day'],
      ['2026-12-08', 'Immaculate Conception'],
      ['2026-12-25', 'Christmas'],
    ];

    $count = 0;
    foreach ($excluded_dates as $date_info) {
      $date = $date_info[0];
      $reason = $date_info[1];

      // Check if excluded date already exists
      $query = \Drupal::entityQuery('node')
        ->condition('type', 'excluded_date')
        ->condition('field_excluded_date', $date)
        ->accessCheck(FALSE);

      if ($query->count()->execute() > 0) {
        continue;
      }

      $node = Node::create([
        'type' => 'excluded_date',
        'title' => 'Excluded: ' . $date,
        'field_excluded_date' => $date,
        'field_excluded_reason' => $reason,
        'status' => 1,
      ]);
      $node->save();
      $count++;
    }

    $this->output()->writeln("   Created $count excluded dates");
  }

  /**
   * Generate dummy notes (at least 1 per student, some with 2).
   */
  private function generateNotes($students) {
    $note_subjects = [
      'Recordatorio de Tarea',
      'Comportamiento en clase',
      'Progreso académico',
      'Asistencia importante',
      'Participación activa',
      'Necesita refuerzo',
      'Excelente trabajo',
      'Revisar conceptos',
      'Comunicación importante',
      'Felicitaciones',
    ];

    $note_contents = [
      'Se realizará una evaluación importante el próximo lunes. Por favor, revisa los temas tratados en clase.',
      'Tu desempeño ha sido excelente. Continúa con ese esfuerzo.',
      'Necesitas mejorar en la participación en clase. Te animo a que participes más.',
      'Excelente presentación del proyecto. Muy bien hecho.',
      'Recordatorio: falta presentar la tarea asignada.',
      'Necesitamos reunirnos para hablar sobre tu progreso.',
      'Te has esforzado mucho. Espero que continúes así.',
      'Falta repasar algunos conceptos de la unidad anterior.',
      'Muy buena participación en clase hoy.',
      'Importante: próxima clase habrá control sorpresa.',
      'Destacada tu dedicación en el trabajo grupal.',
      'Revisa la ecuación que no comprendiste en clase.',
    ];

    $count = 0;
    $users = User::loadMultiple(\Drupal::entityTypeManager()
      ->getStorage('user')
      ->getQuery()
      ->accessCheck(FALSE)
      ->condition('roles', 'docente')
      ->execute());

    if (empty($users)) {
      $this->output()->writeln('   Warning: No docentes found for note creation');
      return;
    }

    $docentes = array_values($users);

    foreach ($students as $student) {
      $student_id = (int) $student->id();

      // Generate 1 or 2 notes per student
      $num_notes = mt_rand(1, 10) <= 7 ? 1 : 2; // 70% probability of 1 note, 30% of 2 notes

      for ($i = 0; $i < $num_notes; $i++) {
        $title = $note_subjects[array_rand($note_subjects)];
        $content = $note_contents[array_rand($note_contents)];
        $date = $this->getRandomDate('2026-03-01', '2026-12-31');
        $docente = $docentes[array_rand($docentes)];

        $node = Node::create([
          'type' => 'note',
          'title' => $title,
          'field_title_note' => $title,
          'field_content_note' => $content,
          'field_student_ref' => ['target_id' => $student_id],
          'field_author_ref' => ['target_id' => $docente->id()],
          'field_date_note' => $date . 'T' . sprintf('%02d:%02d:00', mt_rand(8, 17), mt_rand(0, 59)),
          'uid' => $docente->id(),
          'status' => 1,
        ]);
        $node->save();
        $count++;
      }
    }

    $this->output()->writeln("   Created $count dummy notes");
  }

}
