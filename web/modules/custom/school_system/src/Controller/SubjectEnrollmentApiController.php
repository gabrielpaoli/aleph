<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Subject Enrollment API endpoints.
 */
class SubjectEnrollmentApiController extends ControllerBase {

  /**
   * Get subject enrollments by course and academic year.
   */
  public function getByCourse($course_id, Request $request) {
    $current_user = \Drupal::currentUser();
    if (!$current_user->hasRole('preceptor') && !$current_user->hasRole('directivo') && !$current_user->hasRole('administrator')) {
      return new JsonResponse(['error' => 'Access denied'], 403);
    }

    $academic_year = (int) $request->query->get('academicYear', date('Y'));

    // Find students in course.
    $student_ids = \Drupal::entityQuery('node')
      ->condition('type', 'student')
      ->condition('field_course_ref', $course_id)
      ->accessCheck(FALSE)
      ->execute();

    if (empty($student_ids)) {
      return new JsonResponse([]);
    }

    $query = \Drupal::entityQuery('node')
      ->condition('type', 'subject_enrollment')
      ->condition('field_student_ref', $student_ids, 'IN')
      ->condition('field_academic_year', $academic_year)
      ->accessCheck(FALSE);

    $nids = $query->execute();
    $items = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $items[] = [
          'id' => (int) $node->id(),
          'studentId' => (int) $node->get('field_student_ref')->target_id,
          'subjectId' => (int) $node->get('field_subject_ref')->target_id,
          'academicYear' => (int) $node->get('field_academic_year')->value,
          'status' => $node->get('field_status')->value,
          'gradeAverage' => $node->get('field_grade_average')->value,
          'attempts' => (int) $node->get('field_attempts')->value,
        ];
      }
    }

    return new JsonResponse($items);
  }

  /**
   * Upsert subject enrollments.
   */
  public function upsert(Request $request) {
    $current_user = \Drupal::currentUser();
    if (!$current_user->hasRole('preceptor') && !$current_user->hasRole('directivo') && !$current_user->hasRole('administrator')) {
      return new JsonResponse(['error' => 'Access denied'], 403);
    }

    $data = json_decode($request->getContent(), TRUE);
    if (!$data || empty($data['items']) || !is_array($data['items'])) {
      return new JsonResponse(['error' => 'Invalid payload'], 400);
    }

    $created = 0;
    $updated = 0;

    foreach ($data['items'] as $item) {
      $student_id = $item['studentId'] ?? NULL;
      $subject_id = $item['subjectId'] ?? NULL;
      $academic_year = $item['academicYear'] ?? NULL;
      $status = $item['status'] ?? NULL;

      if (!$student_id || !$subject_id || !$academic_year || !$status) {
        continue;
      }

      $existing_ids = \Drupal::entityQuery('node')
        ->condition('type', 'subject_enrollment')
        ->condition('field_student_ref', $student_id)
        ->condition('field_subject_ref', $subject_id)
        ->condition('field_academic_year', $academic_year)
        ->accessCheck(FALSE)
        ->execute();

      if (!empty($existing_ids)) {
        $existing_id = reset($existing_ids);
        $node = Node::load($existing_id);
        if ($node) {
          $node->set('field_status', $status);
          $node->save();
          $updated++;
        }
      }
      else {
        $node = Node::create([
          'type' => 'subject_enrollment',
          'title' => "Enrollment {$student_id}-{$subject_id}-{$academic_year}",
          'field_student_ref' => ['target_id' => $student_id],
          'field_subject_ref' => ['target_id' => $subject_id],
          'field_academic_year' => $academic_year,
          'field_status' => $status,
          'status' => 1,
        ]);
        $node->save();
        $created++;
      }
    }

    return new JsonResponse([
      'success' => TRUE,
      'created' => $created,
      'updated' => $updated,
    ]);
  }

}
