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

    // Crear cursos
    $this->output()->writeln('📖 Creating courses...');
    $courses = [
      '1A_tarde' => $this->createCourse('1A', 'Tarde'),
      '1B_manana' => $this->createCourse('1B', 'Mañana'),
      '2A_tarde' => $this->createCourse('2A', 'Tarde'),
      '2B_manana' => $this->createCourse('2B', 'Mañana'),
    ];

    // Crear materias para 1A
    $this->output()->writeln('📝 Creating subjects...');
    $subjects_1a = [
      'matematicas' => $this->createSubject('Matemáticas', $courses['1A_tarde']),
      'lengua' => $this->createSubject('Lengua', $courses['1A_tarde']),
      'historia' => $this->createSubject('Historia', $courses['1A_tarde']),
      'geografia' => $this->createSubject('Geografía', $courses['1A_tarde']),
      'ingles' => $this->createSubject('Inglés', $courses['1A_tarde']),
    ];

    // Crear materias para 1B
    $subjects_1b = [
      'matematicas_1b' => $this->createSubject('Matemáticas', $courses['1B_manana']),
      'lengua_1b' => $this->createSubject('Lengua', $courses['1B_manana']),
      'ciencias' => $this->createSubject('Ciencias Naturales', $courses['1B_manana']),
    ];

    // Crear materias para 2A
    $subjects_2a = [
      'matematicas_2a' => $this->createSubject('Matemáticas', $courses['2A_tarde']),
      'fisica' => $this->createSubject('Física', $courses['2A_tarde']),
      'quimica' => $this->createSubject('Química', $courses['2A_tarde']),
    ];

    // Crear estudiantes
    $this->output()->writeln('👨‍🎓 Creating students...');
    $students = [
      $this->createStudent('Juan', 'Pérez', 'padre.perez@email.com', $courses['1A_tarde'], 1),
      $this->createStudent('María', 'González', 'padre.gonzalez@email.com', $courses['1A_tarde'], 2),
      $this->createStudent('Carlos', 'Rodríguez', 'padre.rodriguez@email.com', $courses['1A_tarde'], 3),
      $this->createStudent('Ana', 'Martínez', 'padre.martinez@email.com', $courses['1A_tarde'], 4),
      $this->createStudent('Luis', 'López', 'padre.lopez@email.com', $courses['1A_tarde'], 5),
      $this->createStudent('Sofia', 'Fernández', 'padre.fernandez@email.com', $courses['1B_manana'], 6),
      $this->createStudent('Diego', 'García', 'padre.garcia@email.com', $courses['1B_manana'], 7),
      $this->createStudent('Valentina', 'Sánchez', 'padre.sanchez@email.com', $courses['1B_manana'], 8),
      $this->createStudent('Mateo', 'Romero', 'padre.romero@email.com', $courses['2A_tarde'], 9),
      $this->createStudent('Emma', 'Torres', 'padre.torres@email.com', $courses['2A_tarde'], 10),
    ];

    // Crear docentes
    $this->output()->writeln('👨‍🏫 Creating teachers (as users with docente role)...');

    // Crear usuarios
    $this->output()->writeln('👤 Creating users...');
    $this->createUser('admin@escuela1.com', '1234', 'administrator');
    $this->createUser('preceptor@escuela1.com', '1234', 'preceptor');
    $this->createUser('preceptor@escuela2.com', '1234', 'preceptor');
    
    // Crear directivo
    $this->createUser('directivo@escuela1.com', '1234', 'directivo');
    
    // Crear docentes con materias asignadas
    $this->createUser('roberto.diaz@escuela1.com', '1234', 'docente', [
      $subjects_1a['matematicas'],
      $subjects_1b['matematicas_1b'],
    ]);
    $this->createUser('laura.morales@escuela1.com', '1234', 'docente', [
      $subjects_1a['lengua'],
      $subjects_1b['lengua_1b'],
    ]);

    foreach ($students as $student) {
      $email = $student->get('field_parent_email')->value;
      $this->createUser($email, '1234', 'parent');
    }

    // Crear notas
    $this->output()->writeln('📊 Creating grades...');

    // Juan Pérez
    $this->createGrade($students[0]->id(), $subjects_1a['matematicas'], 8, '2026-03-15');
    $this->createGrade($students[0]->id(), $subjects_1a['matematicas'], 9, '2026-04-20');
    $this->createGrade($students[0]->id(), $subjects_1a['lengua'], 7, '2026-03-18');

    // María González
    $this->createGrade($students[1]->id(), $subjects_1a['matematicas'], 10, '2026-03-15');
    $this->createGrade($students[1]->id(), $subjects_1a['lengua'], 9, '2026-03-18');

    // Crear asistencias
    $this->output()->writeln('📅 Creating attendance records...');
    $this->generateAttendance($students);

    $this->output()->writeln('');
    $this->output()->writeln('✅ Dummy data generated successfully!');
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

    $current_date = clone $start_date;
    $count = 0;

    while ($current_date <= $end_date) {
      $day_of_week = (int) $current_date->format('N');

      if ($day_of_week >= 6) {
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
          'title' => 'Attendance ' . $current_date->format('Y-m-d'),
          'field_student_ref' => ['target_id' => $student->id()],
          'field_date' => $current_date->format('Y-m-d'),
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

}
