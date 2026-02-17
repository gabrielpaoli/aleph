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
   * Get advance year decision by student and academic year.
   */
  public function getByStudent($student_id, Request $request) {
    $current_user = \Drupal::currentUser();
    if ($current_user->isAnonymous()) {
      return new JsonResponse(['error' => 'Access denied'], 403);
    }

    $academic_year = (int) $request->query->get('academicYear', date('Y'));

    $query = \Drupal::entityQuery('node')
      ->condition('type', 'advance_year_decision')
      ->condition('field_student_ref', $student_id)
      ->condition('field_academic_year', $academic_year)
      ->accessCheck(FALSE);

    $nids = $query->execute();
    if (empty($nids)) {
      return new JsonResponse(NULL);
    }

    $node = Node::load(reset($nids));
    if (!$node) {
      return new JsonResponse(NULL);
    }

    return new JsonResponse([
      'id' => (int) $node->id(),
      'studentId' => (int) $node->get('field_student_ref')->target_id,
      'currentCourseId' => (int) $node->get('field_current_course_ref')->target_id,
      'nextCourseId' => $node->get('field_next_course_ref')->target_id ? (int) $node->get('field_next_course_ref')->target_id : NULL,
      'action' => $node->get('field_action')->value,
      'academicYear' => (int) $node->get('field_academic_year')->value,
    ]);
  }

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
   * Close academic year – creates a job and returns immediately.
   *
   * The actual processing happens incrementally inside jobStatus() each time
   * the frontend polls.  This avoids any dependency on fastcgi_finish_request,
   * background workers or cron – every environment is supported.
   */
  public function closeAcademicYear(Request $request) {
    $current_user = \Drupal::currentUser();
    if (!$current_user->hasRole('preceptor') && !$current_user->hasRole('directivo') && !$current_user->hasRole('administrator')) {
      return new JsonResponse(['error' => 'Access denied'], 403);
    }

    $data = json_decode($request->getContent(), TRUE);
    $academic_year = (int) ($data['academicYear'] ?? date('Y'));

    $job_id = uniqid('close_year_', TRUE);
    $state_key = 'school_system.advance_year_job.' . $job_id;

    \Drupal::state()->set($state_key, [
      'status' => 'pending',
      'academicYear' => $academic_year,
      'total' => 0,
      'processed' => 0,
      'updated' => 0,
      'deleted' => 0,
      'started_at' => time(),
      'finished_at' => NULL,
      'error' => NULL,
      'message' => 'Preparando cierre…',
      // Internal: ordered list of student IDs still to process.
      'remaining_ids' => [],
      // Internal: decision_map built during the 'pending' phase.
      'decision_map' => [],
    ]);

    return new JsonResponse(['jobId' => $job_id]);
  }

  /**
   * Poll job status AND advance processing in small batches.
   *
   * - pending  → validate decisions, build work-list, transition to running.
   * - running  → process next BATCH_SIZE students, update counters.
   * - finished / error → just return state (no more work).
   */
  public function jobStatus($job_id) {
    $state = \Drupal::state();
    $state_key = 'school_system.advance_year_job.' . $job_id;
    $info = $state->get($state_key, NULL);

    if (!$info) {
      return new JsonResponse(['error' => 'Job not found'], 404);
    }

    $status = $info['status'] ?? 'unknown';

    // ── pending: validate & build work-list ─────────────────────────────
    if ($status === 'pending') {
      $info = $this->jobInitialize($info, $state_key);
      $state->set($state_key, $info);
      return new JsonResponse($this->publicJobState($info));
    }

    // ── running: process next batch ─────────────────────────────────────
    if ($status === 'running') {
      $info = $this->jobProcessBatch($info, $state_key);
      $state->set($state_key, $info);
      return new JsonResponse($this->publicJobState($info));
    }

    // finished / error – just return current state
    return new JsonResponse($this->publicJobState($info));
  }

  /**
   * Strip internal keys before sending state to the frontend.
   */
  private function publicJobState(array $info): array {
    unset($info['remaining_ids'], $info['decision_map']);
    return $info;
  }

  /**
   * Pending → validate decisions, build work-list, transition to running.
   */
  private function jobInitialize(array $info, string $state_key): array {
    $academic_year = (int) ($info['academicYear'] ?? date('Y'));

    try {
      // Load decisions for the academic year.
      $decision_ids = \Drupal::entityQuery('node')
        ->condition('type', 'advance_year_decision')
        ->condition('field_academic_year', $academic_year)
        ->accessCheck(FALSE)
        ->execute();

      $decision_map = [];
      foreach ($decision_ids as $nid) {
        $node = Node::load($nid);
        if ($node) {
          $sid = (int) $node->get('field_student_ref')->target_id;
          $decision_map[$sid] = [
            'action' => $node->get('field_action')->value,
            'nextCourseId' => $node->get('field_next_course_ref')->target_id
              ? (int) $node->get('field_next_course_ref')->target_id
              : NULL,
          ];
        }
      }

      // Load all active students.
      $student_ids = \Drupal::entityQuery('node')
        ->condition('type', 'student')
        ->condition('status', 1)
        ->accessCheck(FALSE)
        ->execute();

      // Validate: every student must have a decision.
      $missing = [];
      foreach ($student_ids as $sid) {
        if (!isset($decision_map[(int) $sid])) {
          $s = Node::load($sid);
          $missing[] = ['id' => (int) $sid, 'name' => $s ? $s->getTitle() : 'N/A'];
        }
      }
      if (!empty($missing)) {
        $info['status'] = 'error';
        $info['message'] = 'Faltan decisiones para algunos estudiantes';
        $info['missing'] = $missing;
        $info['finished_at'] = time();
        return $info;
      }

      // Validate: none may still be 'cursando'.
      $cursando = [];
      foreach ($student_ids as $sid) {
        $d = $decision_map[(int) $sid] ?? NULL;
        if ($d && ($d['action'] ?? NULL) === 'cursando') {
          $s = Node::load($sid);
          $cursando[] = ['id' => (int) $sid, 'name' => $s ? $s->getTitle() : 'N/A'];
        }
      }
      if (!empty($cursando)) {
        $info['status'] = 'error';
        $info['message'] = 'Hay estudiantes en Cursando. No se puede cerrar el año.';
        $info['cursando'] = $cursando;
        $info['finished_at'] = time();
        return $info;
      }

      // All validations passed – transition to running.
      $info['status'] = 'running';
      $info['total'] = count($student_ids);
      $info['processed'] = 0;
      $info['updated'] = 0;
      $info['deleted'] = 0;
      $info['remaining_ids'] = array_values(array_map('intval', $student_ids));
      $info['decision_map'] = $decision_map;
      $info['message'] = "Procesando 0/" . count($student_ids) . "…";
      return $info;
    }
    catch (\Exception $e) {
      $info['status'] = 'error';
      $info['message'] = $e->getMessage();
      $info['finished_at'] = time();
      return $info;
    }
  }

  /**
   * Process the next batch of students (up to BATCH_SIZE per poll).
   */
  private function jobProcessBatch(array $info, string $state_key): array {
    // How many students to process per poll request.
    $batch_size = 3;

    $remaining = $info['remaining_ids'] ?? [];
    $decision_map = $info['decision_map'] ?? [];
    $academic_year = $info['academicYear'] ?? date('Y');
    $updated = $info['updated'] ?? 0;
    $deleted = $info['deleted'] ?? 0;
    $processed = $info['processed'] ?? 0;
    $total = $info['total'] ?? 0;

    if (empty($remaining)) {
      // Nothing left → mark finished.
      $info['status'] = 'finished';
      $info['finished_at'] = time();
      $info['message'] = 'Completado';
      return $info;
    }

    $batch = array_splice($remaining, 0, $batch_size);

    try {
      foreach ($batch as $sid) {
        $student = Node::load($sid);
        if (!$student) {
          $processed++;
          continue;
        }

        $decision = $decision_map[$sid] ?? NULL;
        if (!$decision) {
          $processed++;
          continue;
        }

        $action = $decision['action'] ?? NULL;
        $next_course_id = $decision['nextCourseId'] ?? NULL;

        if ($action === 'promote' && !$next_course_id) {
          $info['status'] = 'error';
          $info['message'] = 'Curso destino faltante para estudiante promovido';
          $info['studentId'] = $sid;
          $info['finished_at'] = time();
          return $info;
        }

        // Delete related content (attendance, grades, etc.).
        $this->deleteStudentRelatedContent($sid);

        if ($action === 'graduate') {
          $parent_email = $student->get('field_parent_email')->value ?? '';
          $student->delete();
          $deleted++;
          if (!empty($parent_email)) {
            $this->deleteParentUserIfOrphan($parent_email);
          }
        }
        else {
          if ($action === 'promote') {
            $student->set('field_course_ref', ['target_id' => $next_course_id]);
          }
          $student->save();
          $updated++;
        }

        $processed++;
      }

      $info['remaining_ids'] = array_values($remaining);
      $info['processed'] = $processed;
      $info['updated'] = $updated;
      $info['deleted'] = $deleted;

      if (empty($remaining)) {
        $info['status'] = 'finished';
        $info['finished_at'] = time();
        $info['message'] = 'Completado';
      }
      else {
        $info['message'] = "Procesando {$processed}/{$total}…";
      }

      return $info;
    }
    catch (\Exception $e) {
      $info['status'] = 'error';
      $info['message'] = $e->getMessage();
      $info['finished_at'] = time();
      return $info;
    }
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
