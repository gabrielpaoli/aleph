<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Attendance API endpoints.
 *
 * Uses the lightweight custom table `school_system_attendance` instead of
 * Drupal nodes for performance.
 */
class AttendanceApiController extends ControllerBase {

  /**
   * Get attendance records with optional filters.
   */
  public function getAll(Request $request) {
    $db = \Drupal::database();
    $query = $db->select('school_system_attendance', 'a')
      ->fields('a', ['id', 'student_id', 'date', 'status']);

    // Filter by single student.
    $student_id = $request->query->get('studentId');
    if ($student_id) {
      $query->condition('a.student_id', (int) $student_id);
    }

    // Filter by exact date.
    $date = $request->query->get('date');
    if ($date) {
      $query->condition('a.date', $date);
    }

    $course_id = $request->query->get('courseId');
    $year = $request->query->get('year');
    $month = $request->query->get('month');

    if ($course_id) {
      // Resolve student IDs belonging to this course.
      $student_ids = $this->getStudentIdsByCourse((int) $course_id);
      if (empty($student_ids)) {
        return new JsonResponse([]);
      }
      $query->condition('a.student_id', $student_ids, 'IN');
    }

    if ($year && $month !== NULL && $month !== '') {
      $month_padded = str_pad((int) $month + 1, 2, '0', STR_PAD_LEFT);
      $start = "{$year}-{$month_padded}-01";
      $end = date('Y-m-t', strtotime($start));
      $query->condition('a.date', $start, '>=');
      $query->condition('a.date', $end, '<=');
    }
    elseif ($year) {
      $query->condition('a.date', "{$year}-01-01", '>=');
      $query->condition('a.date', "{$year}-12-31", '<=');
    }

    $results = $query->execute()->fetchAll();

    $attendance = [];
    foreach ($results as $row) {
      $attendance[] = [
        'id' => (int) $row->id,
        'studentId' => (int) $row->student_id,
        'date' => $row->date,
        'status' => $row->status,
      ];
    }

    return new JsonResponse($attendance);
  }

  /**
   * Create a single attendance record.
   */
  public function createAttendance(Request $request) {
    $data = json_decode($request->getContent(), TRUE);
    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    $student_id = (int) ($data['studentId'] ?? 0);
    $date = $data['date'] ?? date('Y-m-d');
    $status = $data['status'] ?? 'present';

    if (!$student_id) {
      return new JsonResponse(['error' => 'studentId is required'], 400);
    }

    try {
      $db = \Drupal::database();
      $id = $db->insert('school_system_attendance')
        ->fields([
          'student_id' => $student_id,
          'date' => $date,
          'status' => $status,
          'created' => time(),
        ])
        ->execute();

      return new JsonResponse([
        'id' => (int) $id,
        'studentId' => $student_id,
        'date' => $date,
        'status' => $status,
      ], 201);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Update a single attendance record.
   */
  public function update($id, Request $request) {
    $db = \Drupal::database();
    $existing = $db->select('school_system_attendance', 'a')
      ->fields('a')
      ->condition('a.id', (int) $id)
      ->execute()
      ->fetchObject();

    if (!$existing) {
      return new JsonResponse(['error' => 'Attendance not found'], 404);
    }

    $data = json_decode($request->getContent(), TRUE);
    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      $fields = [];
      if (isset($data['status'])) {
        $fields['status'] = $data['status'];
      }
      if (isset($data['date'])) {
        $fields['date'] = $data['date'];
      }

      if (!empty($fields)) {
        $db->update('school_system_attendance')
          ->fields($fields)
          ->condition('id', (int) $id)
          ->execute();
      }

      return new JsonResponse([
        'id' => (int) $id,
        'studentId' => (int) $existing->student_id,
        'date' => $fields['date'] ?? $existing->date,
        'status' => $fields['status'] ?? $existing->status,
      ]);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Bulk upsert attendance records.
   */
  public function bulkUpdate(Request $request) {
    $data = json_decode($request->getContent(), TRUE);
    if (!$data || !is_array($data)) {
      return new JsonResponse(['error' => 'Invalid JSON array'], 400);
    }

    $db = \Drupal::database();
    $count = 0;

    try {
      foreach ($data as $item) {
        $student_id = (int) ($item['studentId'] ?? 0);
        $date = $item['date'] ?? '';
        $status = $item['status'] ?? 'present';

        if (!$student_id || !$date) {
          continue;
        }

        $db->merge('school_system_attendance')
          ->keys([
            'student_id' => $student_id,
            'date' => $date,
          ])
          ->fields([
            'status' => $status,
            'created' => time(),
          ])
          ->execute();

        $count++;
      }

      return new JsonResponse([
        'success' => TRUE,
        'count' => $count,
      ]);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Get student node IDs that belong to a given course.
   */
  private function getStudentIdsByCourse(int $course_id): array {
    $nids = \Drupal::entityQuery('node')
      ->condition('type', 'student')
      ->condition('field_course_ref', $course_id)
      ->accessCheck(FALSE)
      ->execute();

    return array_map('intval', array_values($nids));
  }

}
