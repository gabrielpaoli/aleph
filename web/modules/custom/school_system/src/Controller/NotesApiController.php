<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Notes API endpoints.
 */
class NotesApiController extends ControllerBase {

  /**
   * Get all notes with pagination and filters.
   */
  public function getAll(Request $request) {
    $page = (int) $request->query->get('page', 1);
    $limit = (int) $request->query->get('limit', 10);
    $student_id = $request->query->get('studentId');
    $author_id = $request->query->get('authorId');
    $course_id = $request->query->get('courseId');
    $date_from = $request->query->get('dateFrom');
    $date_to = $request->query->get('dateTo');

    $query = \Drupal::entityQuery('node')
      ->condition('type', 'note')
      ->condition('status', 1)
      ->sort('field_date_note', 'DESC')
      ->accessCheck(FALSE);

    // Filter by student
    if ($student_id) {
      $query->condition('field_student_ref', $student_id);
    }

    // Filter by author
    if ($author_id) {
      $query->condition('field_author_ref', $author_id);
    }

    // Filter by course
    if ($course_id) {
      $query->condition('field_course_ref', $course_id);
    }

    // Filter by date range
    if ($date_from) {
      $query->condition('field_date_note', $date_from, '>=');
    }

    if ($date_to) {
      // Add 1 day to include the entire end date
      $end_date = new \DateTime($date_to);
      $end_date->modify('+1 day');
      $query->condition('field_date_note', $end_date->format('Y-m-d\TH:i:s'), '<');
    }

    // Count total results
    $count_query = clone $query;
    $total = $count_query->count()->execute();

    // Apply pagination
    $offset = ($page - 1) * $limit;
    $query->range($offset, $limit);

    $nids = $query->execute();
    $notes = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $notes[] = $this->formatNote($node);
      }
    }

    $pages = ceil($total / $limit);

    return new JsonResponse([
      'items' => $notes,
      'total' => $total,
      'page' => $page,
      'limit' => $limit,
      'pages' => $pages,
    ]);
  }

  /**
   * Get notes for a specific student.
   */
  public function getByStudent($student_id) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'note')
      ->condition('status', 1)
      ->condition('field_student_ref', $student_id)
      ->sort('field_date_note', 'DESC')
      ->accessCheck(FALSE);

    $nids = $query->execute();
    $notes = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $notes[] = $this->formatNote($node);
      }
    }

    return new JsonResponse($notes);
  }

  /**
   * Get notes for a course (for all students in course).
   */
  public function getByCourse($course_id) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'note')
      ->condition('status', 1)
      ->condition('field_course_ref', $course_id)
      ->sort('field_date_note', 'DESC')
      ->accessCheck(FALSE);

    $nids = $query->execute();
    $notes = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $notes[] = $this->formatNote($node);
      }
    }

    return new JsonResponse($notes);
  }

  /**
   * Create a note (individual or for a course).
   */
  public function createNote(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    $current_user = \Drupal::currentUser();

    if ($current_user->isAnonymous()) {
      return new JsonResponse(['error' => 'User not authenticated'], 401);
    }

    // Check if user has permission to create notes
    $allowed_roles = ['docente', 'directivo', 'preceptor', 'administrator'];
    $user_roles = $current_user->getRoles();
    $has_permission = !empty(array_intersect($user_roles, $allowed_roles));

    if (!$has_permission) {
      return new JsonResponse(['error' => 'User does not have permission to create notes'], 403);
    }

    try {
      $node = Node::create([
        'type' => 'note',
        'title' => $data['title'] ?? 'Note',
        'field_title_note' => $data['title'] ?? 'Note',
        'field_content_note' => $data['content'] ?? '',
        'field_student_ref' => isset($data['studentId']) ? ['target_id' => $data['studentId']] : NULL,
        'field_course_ref' => isset($data['courseId']) ? ['target_id' => $data['courseId']] : NULL,
        'field_author_ref' => ['target_id' => $current_user->id()],
        'field_date_note' => \Drupal::service('date.formatter')->format(time(), 'custom', 'Y-m-d\TH:i:s'),
        'uid' => $current_user->id(),
        'status' => 1,
      ]);

      $node->save();

      \Drupal::logger('school_system')->notice('Note created: @id', ['@id' => $node->id()]);

      // Send emails to parent(s)
      $this->sendNotesToParents($node, $data);

      return new JsonResponse($this->formatNote($node), 201);
    } catch (\Exception $e) {
      \Drupal::logger('school_system')->error('Error creating note: @message', ['@message' => $e->getMessage()]);
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Send notes to parents.
   */
  private function sendNotesToParents($note, $data) {
    try {
      $students = [];

      // If individual note, get the student
      $student_ref = $note->get('field_student_ref')->target_id;
      if ($student_ref) {
        $student = Node::load($student_ref);
        if ($student) {
          $students[] = $student;
        }
      } //If course note, get all students in the course
      else {
        $course_ref = $note->get('field_course_ref')->target_id;
        if ($course_ref) {
          $query = \Drupal::entityQuery('node')
            ->condition('type', 'student')
            ->condition('field_course_ref', $course_ref)
            ->condition('status', 1)
            ->accessCheck(FALSE);

          $student_ids = $query->execute();
          foreach ($student_ids as $sid) {
            $student = Node::load($sid);
            if ($student) {
              $students[] = $student;
            }
          }
        }
      }

      // Send emails to parents
      $mailManager = \Drupal::service('plugin.manager.mail');
      $module = 'school_system';
      $key = 'note_notification';

      foreach ($students as $student) {
        $parent_email = $student->get('field_parent_email')->value;

        if (!empty($parent_email)) {
          $first_name = $student->get('field_first_name')->value ?? '';
          $last_name = $student->get('field_last_name')->value ?? '';
          $student_name = trim($first_name . ' ' . $last_name);

          $params = [
            'note_title' => $note->get('field_title_note')->value ?? '',
            'note_content' => $note->get('field_content_note')->value ?? '',
            'student_name' => $student_name ?: 'Estudiante',
            'author_name' => $note->getOwner()->getDisplayName() ?? 'Docente',
          ];

          $result = $mailManager->mail($module, $key, $parent_email, 'es', $params);

          if ($result['result'] === TRUE) {
            \Drupal::logger('school_system')->notice('Note email sent to @email', ['@email' => $parent_email]);
          } else {
            \Drupal::logger('school_system')->warning('Failed to send note email to @email', ['@email' => $parent_email]);
          }
        }
      }
    } catch (\Exception $e) {
      \Drupal::logger('school_system')->error('Error sending note emails: @message', ['@message' => $e->getMessage()]);
      // Don't throw - email sending failure shouldn't fail the note creation
    }
  }

  /**
   * Format note for API response.
   */
  private function formatNote($node) {
    $author = $node->getOwner();
    $student_name = 'N/A';
    
    // Get student name if available
    $student_id = $node->get('field_student_ref')->target_id;
    if ($student_id) {
      $student = Node::load($student_id);
      if ($student) {
        $first_name = $student->get('field_first_name')->value ?? '';
        $last_name = $student->get('field_last_name')->value ?? '';
        $student_name = trim($first_name . ' ' . $last_name);
      }
    }

    return [
      'id' => (int) $node->id(),
      'title' => $node->get('field_title_note')->value,
      'content' => $node->get('field_content_note')->value,
      'studentId' => $student_id,
      'studentName' => $student_name,
      'courseId' => $node->get('field_course_ref')->target_id,
      'authorId' => $node->get('field_author_ref')->target_id,
      'authorName' => $author ? $author->getDisplayName() : '',
      'date' => $node->get('field_date_note')->value,
      'createdAt' => $node->getCreatedTime(),
    ];
  }
}
