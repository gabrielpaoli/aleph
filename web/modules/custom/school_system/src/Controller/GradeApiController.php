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
    if ($subject_id) {
      $query->condition('field_subject_ref', $subject_id);
    }

    $nids = $query->execute();
    $grades = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $grades[] = $this->formatGrade($node);
      }
    }

    return new JsonResponse($grades);
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

    try {
      $node->delete();
      return new JsonResponse(['success' => TRUE]);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
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
