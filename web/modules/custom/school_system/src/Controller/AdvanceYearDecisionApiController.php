<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for advance year decision API endpoints.
 */
class AdvanceYearDecisionApiController extends ControllerBase {

  /**
   * Get advance year decisions by course and academic year.
   */
  public function getByCourse($course_id, Request $request) {
    $current_user = \Drupal::currentUser();
    if (!$current_user->hasRole('preceptor') && !$current_user->hasRole('directivo') && !$current_user->hasRole('administrator')) {
      return new JsonResponse(['error' => 'Access denied'], 403);
    }

    $academic_year = (int) $request->query->get('academicYear', date('Y'));

    $student_ids = \Drupal::entityQuery('node')
      ->condition('type', 'student')
      ->condition('field_course_ref', $course_id)
      ->accessCheck(FALSE)
      ->execute();

    if (empty($student_ids)) {
      return new JsonResponse([]);
    }

    $query = \Drupal::entityQuery('node')
      ->condition('type', 'advance_year_decision')
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
          'currentCourseId' => (int) $node->get('field_current_course_ref')->target_id,
          'nextCourseId' => $node->get('field_next_course_ref')->target_id ? (int) $node->get('field_next_course_ref')->target_id : NULL,
          'action' => $node->get('field_action')->value,
          'academicYear' => (int) $node->get('field_academic_year')->value,
        ];
      }
    }

    return new JsonResponse($items);
  }

  /**
   * Upsert advance year decisions.
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
      $current_course_id = $item['currentCourseId'] ?? NULL;
      $next_course_id = $item['nextCourseId'] ?? NULL;
      $academic_year = $item['academicYear'] ?? NULL;
      $action = $item['action'] ?? NULL;

      if (!$student_id || !$current_course_id || !$academic_year || !$action) {
        continue;
      }

      $existing_ids = \Drupal::entityQuery('node')
        ->condition('type', 'advance_year_decision')
        ->condition('field_student_ref', $student_id)
        ->condition('field_academic_year', $academic_year)
        ->accessCheck(FALSE)
        ->execute();

      if (!empty($existing_ids)) {
        $existing_id = reset($existing_ids);
        $node = Node::load($existing_id);
        if ($node) {
          $node->set('field_current_course_ref', ['target_id' => $current_course_id]);
          $node->set('field_next_course_ref', $next_course_id ? ['target_id' => $next_course_id] : NULL);
          $node->set('field_action', $action);
          $node->save();
          $updated++;
        }
      }
      else {
        $node = Node::create([
          'type' => 'advance_year_decision',
          'title' => "Advance Year {$student_id}-{$academic_year}",
          'field_student_ref' => ['target_id' => $student_id],
          'field_current_course_ref' => ['target_id' => $current_course_id],
          'field_next_course_ref' => $next_course_id ? ['target_id' => $next_course_id] : NULL,
          'field_action' => $action,
          'field_academic_year' => $academic_year,
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
