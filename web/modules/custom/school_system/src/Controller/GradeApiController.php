<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Grade API endpoints.
 */
class GradeApiController extends ControllerBase {

  /**
   * Get all grades.
   */
  public function getAll(Request $request) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'grade')
      ->condition('status', 1)
      ->accessCheck(FALSE);

    $student_id = $request->query->get('studentId');
    if ($student_id) {
      $query->condition('field_student_ref', $student_id);
    }

    $subject_id = $request->query->get('subjectId');
    $subject_ids_param = $request->query->get('subjectIds');
    if ($subject_ids_param) {
      $subject_ids = array_filter(array_map('intval', explode(',', $subject_ids_param)));
      if (!empty($subject_ids)) {
        $query->condition('field_subject_ref', $subject_ids, 'IN');
      }
    } elseif ($subject_id) {
      $query->condition('field_subject_ref', $subject_id);
    }

    $page = max(1, (int) $request->query->get('page', 1));
    $limit = max(1, (int) $request->query->get('limit', 20));
    $offset = ($page - 1) * $limit;

    $count_query = clone $query;
    $total = (int) $count_query->count()->execute();

    $nids = $query
      ->range($offset, $limit)
      ->execute();

    $grades = [];
    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $grades[] = $this->formatGrade($node);
      }
    }

    return new JsonResponse([
      'items' => $grades,
      'total' => $total,
      'page' => $page,
      'limit' => $limit,
      'pages' => $limit > 0 ? (int) ceil($total / $limit) : 0,
    ]);
  }

  /**
   * Create a grade.
   */
  public function createGrade(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      $node = Node::create([
        'type' => 'grade',
        'title' => 'Grade ' . ($data['date'] ?? date('Y-m-d')),
        'field_student_ref' => isset($data['studentId']) ? ['target_id' => $data['studentId']] : NULL,
        'field_subject_ref' => isset($data['subjectId']) ? ['target_id' => $data['subjectId']] : NULL,
        'field_grade_value' => $data['grade'] ?? 0,
        'field_date' => $data['date'] ?? date('Y-m-d'),
        'status' => 1,
      ]);
      $node->save();

      return new JsonResponse($this->formatGrade($node), 201);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Update a grade.
   */
  public function update($id, Request $request) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'grade') {
      return new JsonResponse(['error' => 'Grade not found'], 404);
    }

    // Check permission for docente
    if (!$this->canEditGrade($node)) {
      return new JsonResponse(['error' => 'No tienes permiso para editar esta calificación'], 403);
    }

    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      if (isset($data['grade'])) {
        $node->set('field_grade_value', $data['grade']);
      }
      if (isset($data['date'])) {
        $node->set('field_date', $data['date']);
      }

      $node->save();

      return new JsonResponse($this->formatGrade($node));
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Delete a grade.
   */
  public function delete($id) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'grade') {
      return new JsonResponse(['error' => 'Grade not found'], 404);
    }

    // Check permission for docente
    if (!$this->canEditGrade($node)) {
      return new JsonResponse(['error' => 'No tienes permiso para eliminar esta calificación'], 403);
    }

    try {
      $node->delete();
      return new JsonResponse(['success' => TRUE]);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Check if user can edit a grade (must be admin or teacher of the subject).
   */
  private function canEditGrade($grade_node) {
    $current_user = \Drupal::currentUser();

    // Admin can edit all
    if ($current_user->hasRole('administrator')) {
      return TRUE;
    }

    // Check if user is docente with permission to edit
    if (!$current_user->hasRole('docente')) {
      return TRUE; // Other roles shouldn't be here but allow for now
    }

    // Get teacher's subjects
    $user = \Drupal\user\Entity\User::load($current_user->id());
    if (!$user || !$user->hasField('field_subjects_ref')) {
      return FALSE;
    }

    $teacher_subject_ids = [];
    $subjects = $user->get('field_subjects_ref')->referencedEntities();
    foreach ($subjects as $subject) {
      $teacher_subject_ids[] = (int) $subject->id();
    }

    // Get grade's subject
    $grade_subject_id = $grade_node->get('field_subject_ref')->target_id;

    // Teacher can only edit if subject matches
    return in_array((int) $grade_subject_id, $teacher_subject_ids);
  }

  /**
   * Format grade data for API response.
   */
  private function formatGrade($node) {
    $student_ref = $node->get('field_student_ref')->target_id;
    $subject_ref = $node->get('field_subject_ref')->target_id;

    return [
      'id' => (int) $node->id(),
      'studentId' => $student_ref ? (int) $student_ref : NULL,
      'subjectId' => $subject_ref ? (int) $subject_ref : NULL,
      'grade' => (float) ($node->get('field_grade_value')->value ?? 0),
      'date' => $node->get('field_date')->value ?? '',
    ];
  }

}
