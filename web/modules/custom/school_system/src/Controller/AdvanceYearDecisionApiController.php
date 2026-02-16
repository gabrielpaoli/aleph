<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Drupal\user\Entity\User;
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

  /**
   * Close academic year and reset student-related data.
   */
  public function closeAcademicYear(Request $request) {
    $current_user = \Drupal::currentUser();
    if (!$current_user->hasRole('preceptor') && !$current_user->hasRole('directivo') && !$current_user->hasRole('administrator')) {
      return new JsonResponse(['error' => 'Access denied'], 403);
    }

    $data = json_decode($request->getContent(), TRUE);
    $academic_year = (int) ($data['academicYear'] ?? date('Y'));

    $decision_ids = \Drupal::entityQuery('node')
      ->condition('type', 'advance_year_decision')
      ->condition('field_academic_year', $academic_year)
      ->accessCheck(FALSE)
      ->execute();

    $decision_map = [];
    foreach ($decision_ids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $student_id = (int) $node->get('field_student_ref')->target_id;
        $decision_map[$student_id] = [
          'action' => $node->get('field_action')->value,
          'nextCourseId' => $node->get('field_next_course_ref')->target_id ? (int) $node->get('field_next_course_ref')->target_id : NULL,
        ];
      }
    }

    $student_ids = \Drupal::entityQuery('node')
      ->condition('type', 'student')
      ->condition('status', 1)
      ->accessCheck(FALSE)
      ->execute();

    $missing = [];
    foreach ($student_ids as $student_id) {
      if (!isset($decision_map[(int) $student_id])) {
        $student = Node::load($student_id);
        $missing[] = [
          'id' => (int) $student_id,
          'name' => $student ? $student->getTitle() : 'N/A',
        ];
      }
    }

    if (!empty($missing)) {
      return new JsonResponse([
        'error' => 'Missing advance year decisions for some students',
        'missing' => $missing,
      ], 400);
    }

    $updated = 0;
    $deleted = 0;

    foreach ($student_ids as $student_id) {
      $student = Node::load($student_id);
      if (!$student) {
        continue;
      }

      $decision = $decision_map[(int) $student_id];
      $action = $decision['action'] ?? NULL;
      $next_course_id = $decision['nextCourseId'] ?? NULL;

      if ($action === 'promote' && !$next_course_id) {
        return new JsonResponse([
          'error' => 'Missing next course for promoted student',
          'studentId' => (int) $student_id,
        ], 400);
      }

      $this->deleteStudentRelatedContent($student_id);

      if ($action === 'graduate') {
        $parent_email = $student->get('field_parent_email')->value ?? '';
        $student->delete();
        $deleted++;

        if (!empty($parent_email)) {
          $this->deleteParentUserIfOrphan($parent_email);
        }
        continue;
      }

      if ($action === 'promote') {
        $student->set('field_course_ref', ['target_id' => $next_course_id]);
      }

      $student->save();
      $updated++;
    }

    return new JsonResponse([
      'success' => TRUE,
      'updated' => $updated,
      'deleted' => $deleted,
    ]);
  }

  /**
   * Delete content related to a student.
   */
  private function deleteStudentRelatedContent($student_id) {
    $types = [
      'attendance',
      'grade',
      'period_grade',
      'note',
      'subject_enrollment',
      'advance_year_decision',
    ];

    foreach ($types as $type) {
      $query = \Drupal::entityQuery('node')
        ->condition('type', $type)
        ->condition('field_student_ref', $student_id)
        ->accessCheck(FALSE);

      $nids = $query->execute();
      if (empty($nids)) {
        continue;
      }

      $nodes = Node::loadMultiple($nids);
      foreach ($nodes as $node) {
        $node->delete();
      }
    }
  }

  /**
   * Delete parent user if no students remain for the email.
   */
  private function deleteParentUserIfOrphan($parent_email) {
    $remaining_students = \Drupal::entityQuery('node')
      ->condition('type', 'student')
      ->condition('field_parent_email', $parent_email)
      ->condition('status', 1)
      ->accessCheck(FALSE)
      ->execute();

    if (!empty($remaining_students)) {
      return;
    }

    $users = \Drupal::entityTypeManager()
      ->getStorage('user')
      ->loadByProperties(['mail' => $parent_email]);

    if (empty($users)) {
      return;
    }

    $user = reset($users);
    if (!$user instanceof User) {
      return;
    }

    $roles = $user->getRoles();
    $is_parent_only = in_array('parent', $roles, TRUE) && count($roles) === 1;

    if ($is_parent_only && $user->id() != 1) {
      $user->delete();
    }
  }

}
