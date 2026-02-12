<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Attendance API endpoints.
 */
class AttendanceApiController extends ControllerBase {

  /**
   * Get all attendance records.
   */
  public function getAll(Request $request) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'attendance')
      ->condition('status', 1)
      ->accessCheck(TRUE);

    // Filtros
    $student_id = $request->query->get('studentId');
    if ($student_id) {
      $query->condition('field_student_ref', $student_id);
    }

    $date = $request->query->get('date');
    if ($date) {
      $query->condition('field_date', $date);
    }

    $course_id = $request->query->get('courseId');
    $year = $request->query->get('year');
    $month = $request->query->get('month');

    if ($course_id && $year && $month !== NULL) {
      // Obtener estudiantes del curso
      $student_query = \Drupal::entityQuery('node')
        ->condition('type', 'student')
        ->condition('field_course_ref', $course_id)
        ->accessCheck(TRUE);
      $student_ids = $student_query->execute();

      if (!empty($student_ids)) {
        $query->condition('field_student_ref', $student_ids, 'IN');

        // Filtrar por mes y año
        $month_padded = str_pad($month + 1, 2, '0', STR_PAD_LEFT);
        $start_date = "$year-$month_padded-01";
        $end_date = date("Y-m-t", strtotime($start_date));

        $query->condition('field_date', $start_date, '>=');
        $query->condition('field_date', $end_date, '<=');
      }
    }

    $nids = $query->execute();
    $attendance = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $attendance[] = $this->formatAttendance($node);
      }
    }

    return new JsonResponse($attendance);
  }

  /**
   * Create attendance record.
   */
  public function createAttendance(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      $node = Node::create([
        'type' => 'attendance',
        'title' => 'Attendance ' . ($data['date'] ?? date('Y-m-d')),
        'field_student_ref' => isset($data['studentId']) ? ['target_id' => $data['studentId']] : NULL,
        'field_date' => $data['date'] ?? date('Y-m-d'),
        'field_status' => $data['status'] ?? 'present',
      ]);
      $node->save();

      return new JsonResponse($this->formatAttendance($node), 201);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Update attendance record.
   */
  public function update($id, Request $request) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'attendance') {
      return new JsonResponse(['error' => 'Attendance not found'], 404);
    }

    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      if (isset($data['status'])) {
        $node->set('field_status', $data['status']);
      }
      if (isset($data['date'])) {
        $node->set('field_date', $data['date']);
      }

      $node->save();

      return new JsonResponse($this->formatAttendance($node));
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Bulk update attendance records.
   */
  public function bulkUpdate(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data || !is_array($data)) {
      return new JsonResponse(['error' => 'Invalid JSON array'], 400);
    }

    $updated = 0;

    try {
      foreach ($data as $attendance_data) {
        if (!isset($attendance_data['studentId']) || !isset($attendance_data['date'])) {
          continue;
        }

        // Buscar si ya existe un registro para este estudiante y fecha
        $query = \Drupal::entityQuery('node')
          ->condition('type', 'attendance')
          ->condition('field_student_ref', $attendance_data['studentId'])
          ->condition('field_date', $attendance_data['date'])
          ->accessCheck(TRUE);

        $nids = $query->execute();

        if (!empty($nids)) {
          // Actualizar existente
          $nid = reset($nids);
          $node = Node::load($nid);
          if ($node) {
            $node->set('field_status', $attendance_data['status']);
            $node->save();
          }
        }
        else {
          // Crear nuevo
          $node = Node::create([
            'type' => 'attendance',
            'title' => 'Attendance ' . $attendance_data['date'],
            'field_student_ref' => ['target_id' => $attendance_data['studentId']],
            'field_date' => $attendance_data['date'],
            'field_status' => $attendance_data['status'],
          ]);
          $node->save();
        }

        $updated++;
      }

      return new JsonResponse([
        'success' => TRUE,
        'count' => $updated,
      ]);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Format attendance data for API response.
   */
  private function formatAttendance($node) {
    $student_ref = $node->get('field_student_ref')->target_id;

    return [
      'id' => (int) $node->id(),
      'studentId' => $student_ref ? (int) $student_ref : NULL,
      'date' => $node->get('field_date')->value ?? '',
      'status' => $node->get('field_status')->value ?? '',
    ];
  }

}
