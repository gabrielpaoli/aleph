<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Period Grade API endpoints (Trimestres y Final).
 */
class PeriodGradeApiController extends ControllerBase {

  /**
   * Get all period grades with optional filters.
   */
  public function getAll(Request $request) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'period_grade')
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

    $academic_year = $request->query->get('academicYear');
    if ($academic_year) {
      $query->condition('field_academic_year', $academic_year);
    }

    $nids = $query->execute();

    $period_grades = [];
    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $period_grades[] = $this->formatPeriodGrade($node);
      }
    }

    return new JsonResponse($period_grades);
  }

  /**
   * Create a period grade.
   */
  public function createPeriodGrade(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    if (empty($data['studentId']) || empty($data['subjectId']) || empty($data['academicYear'])) {
      return new JsonResponse(['error' => 'studentId, subjectId, and academicYear are required'], 400);
    }

    // Check if period grade already exists for this combination
    $existing_query = \Drupal::entityQuery('node')
      ->condition('type', 'period_grade')
      ->condition('field_student_ref', $data['studentId'])
      ->condition('field_subject_ref', $data['subjectId'])
      ->condition('field_academic_year', $data['academicYear'])
      ->accessCheck(FALSE);

    $existing = $existing_query->execute();
    if (!empty($existing)) {
      return new JsonResponse(['error' => 'Period grade already exists for this student, subject, and year'], 409);
    }

    try {
      $node = Node::create([
        'type' => 'period_grade',
        'title' => 'Period Grade ' . $data['studentId'] . '-' . $data['subjectId'] . '-' . $data['academicYear'],
        'field_student_ref' => ['target_id' => $data['studentId']],
        'field_subject_ref' => ['target_id' => $data['subjectId']],
        'field_academic_year' => $data['academicYear'],
        'field_trimester_1' => isset($data['trimester_1']) ? (float) $data['trimester_1'] : NULL,
        'field_trimester_2' => isset($data['trimester_2']) ? (float) $data['trimester_2'] : NULL,
        'field_trimester_3' => isset($data['trimester_3']) ? (float) $data['trimester_3'] : NULL,
        'field_final_grade' => isset($data['final_grade']) ? (float) $data['final_grade'] : NULL,
        'field_recuperatorio_diciembre' => isset($data['recuperatorio_diciembre']) ? (float) $data['recuperatorio_diciembre'] : NULL,
        'field_recuperatorio_febrero' => isset($data['recuperatorio_febrero']) ? (float) $data['recuperatorio_febrero'] : NULL,
        'status' => 1,
      ]);
      $node->save();

      return new JsonResponse($this->formatPeriodGrade($node), 201);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Update a period grade.
   */
  public function update($id, Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    $node = Node::load($id);
    if (!$node || $node->getType() !== 'period_grade') {
      return new JsonResponse(['error' => 'Period grade not found'], 404);
    }

    try {
      if (isset($data['trimester_1'])) {
        $node->set('field_trimester_1', (float) $data['trimester_1']);
      }
      if (isset($data['trimester_2'])) {
        $node->set('field_trimester_2', (float) $data['trimester_2']);
      }
      if (isset($data['trimester_3'])) {
        $node->set('field_trimester_3', (float) $data['trimester_3']);
      }
      if (isset($data['final_grade'])) {
        $node->set('field_final_grade', (float) $data['final_grade']);
      }
      if (isset($data['recuperatorio_diciembre'])) {
        $node->set('field_recuperatorio_diciembre', (float) $data['recuperatorio_diciembre']);
      }
      if (isset($data['recuperatorio_febrero'])) {
        $node->set('field_recuperatorio_febrero', (float) $data['recuperatorio_febrero']);
      }

      $node->save();

      return new JsonResponse($this->formatPeriodGrade($node));
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Delete a period grade.
   */
  public function delete($id) {
    $node = Node::load($id);
    if (!$node || $node->getType() !== 'period_grade') {
      return new JsonResponse(['error' => 'Period grade not found'], 404);
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
   * Format period grade data for API response.
   */
  private function formatPeriodGrade($node) {
    $student_ref = $node->get('field_student_ref')->target_id;
    $subject_ref = $node->get('field_subject_ref')->target_id;

    return [
      'id' => (int) $node->id(),
      'studentId' => $student_ref ? (int) $student_ref : NULL,
      'subjectId' => $subject_ref ? (int) $subject_ref : NULL,
      'academicYear' => (int) ($node->get('field_academic_year')->value ?? 0),
      'trimester_1' => $node->get('field_trimester_1')->value !== NULL ? (float) $node->get('field_trimester_1')->value : NULL,
      'trimester_2' => $node->get('field_trimester_2')->value !== NULL ? (float) $node->get('field_trimester_2')->value : NULL,
      'trimester_3' => $node->get('field_trimester_3')->value !== NULL ? (float) $node->get('field_trimester_3')->value : NULL,
      'final_grade' => $node->get('field_final_grade')->value !== NULL ? (float) $node->get('field_final_grade')->value : NULL,
      'recuperatorio_diciembre' => $node->get('field_recuperatorio_diciembre')->value !== NULL ? (float) $node->get('field_recuperatorio_diciembre')->value : NULL,
      'recuperatorio_febrero' => $node->get('field_recuperatorio_febrero')->value !== NULL ? (float) $node->get('field_recuperatorio_febrero')->value : NULL,
    ];
  }

}
