<?php

namespace Drupal\school_system\Plugin\QueueWorker;

use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\node\Entity\Node;

/**
 * Processes close-year jobs for the school_system module.
 *
 * @QueueWorker(
 *   id = "school_system_close_year",
 *   title = "School System: Close academic year",
 *   cron = {"time" = 60}
 * )
 */
class CloseYearQueueWorker extends QueueWorkerBase {

  /**
   * {@inheritdoc}
   */
  public function processItem($data) {
    $job_id = $data['jobId'] ?? NULL;
    $academic_year = (int) ($data['academicYear'] ?? date('Y'));
    if (!$job_id) {
      return;
    }

    $state = \Drupal::state();
    $state_key = 'school_system.advance_year_job.' . $job_id;
    $state->set($state_key, [
      'status' => 'running',
      'academicYear' => $academic_year,
      'total' => 0,
      'processed' => 0,
      'updated' => 0,
      'deleted' => 0,
      'started_at' => time(),
      'finished_at' => NULL,
      'error' => NULL,
      'message' => 'Job started',
    ]);

    try {
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
        $state->set($state_key, [
          'status' => 'error',
          'message' => 'Missing advance year decisions for some students',
          'missing' => $missing,
          'finished_at' => time(),
        ]);
        return;
      }

      $cursando = [];
      foreach ($student_ids as $student_id) {
        $decision = $decision_map[(int) $student_id] ?? NULL;
        if ($decision && ($decision['action'] ?? NULL) === 'cursando') {
          $student = Node::load($student_id);
          $cursando[] = [
            'id' => (int) $student_id,
            'name' => $student ? $student->getTitle() : 'N/A',
          ];
        }
      }

      if (!empty($cursando)) {
        $state->set($state_key, [
          'status' => 'error',
          'message' => 'Hay estudiantes en Cursando. No se puede cerrar el ano lectivo.',
          'cursando' => $cursando,
          'finished_at' => time(),
        ]);
        return;
      }

      $total = count($student_ids);
      $info = $state->get($state_key);
      $info['total'] = $total;
      $info['processed'] = 0;
      $info['updated'] = 0;
      $info['deleted'] = 0;
      $info['status'] = 'running';
      $state->set($state_key, $info);

      $updated = 0;
      $deleted = 0;
      $processed = 0;

      foreach ($student_ids as $student_id) {
        $student = Node::load($student_id);
        if (!$student) {
          continue;
        }

        $decision = $decision_map[(int) $student_id];
        $action = $decision['action'] ?? NULL;
        $next_course_id = $decision['nextCourseId'] ?? NULL;

        if ($action === 'promote' && !$next_course_id) {
          $state->set($state_key, [
            'status' => 'error',
            'message' => 'Missing next course for promoted student',
            'studentId' => (int) $student_id,
            'finished_at' => time(),
          ]);
          return;
        }

        // Delete related content
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
        // update state progress
        $info = $state->get($state_key);
        $info['processed'] = $processed;
        $info['updated'] = $updated;
        $info['deleted'] = $deleted;
        $info['message'] = "Processed {$processed}/{$total}";
        $state->set($state_key, $info);

        // small sleep to allow frontend to observe progress
        usleep(50000);
      }

      $info = $state->get($state_key);
      $info['status'] = 'finished';
      $info['finished_at'] = time();
      $info['updated'] = $updated;
      $info['deleted'] = $deleted;
      $info['processed'] = $processed;
      $info['message'] = 'Completed';
      $state->set($state_key, $info);
    }
    catch (\Exception $e) {
      $state->set($state_key, [
        'status' => 'error',
        'message' => $e->getMessage(),
        'finished_at' => time(),
      ]);
    }
  }

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
    if (!$user instanceof \Drupal\user\Entity\User) {
      return;
    }

    $roles = $user->getRoles();
    $is_parent_only = in_array('parent', $roles, TRUE) && count($roles) === 1;

    if ($is_parent_only && $user->id() != 1) {
      $user->delete();
    }
  }

}
