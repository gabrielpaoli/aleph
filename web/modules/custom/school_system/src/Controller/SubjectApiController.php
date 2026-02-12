<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Subject API endpoints.
 */
class SubjectApiController extends ControllerBase {

  /**
   * Get all subjects.
   */
  public function getAll(Request $request) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'subject')
      ->condition('status', 1)
      ->accessCheck(TRUE);

    $course_id = $request->query->get('courseId');
    if ($course_id) {
      $query->condition('field_course_ref', $course_id);
    }

    $nids = $query->execute();
    $subjects = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $subjects[] = $this->formatSubject($node);
      }
    }

    return new JsonResponse($subjects);
  }

  /**
   * Create a subject.
   */
  public function createSubject(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      $node = Node::create([
        'type' => 'subject',
        'title' => $data['name'] ?? '',
        'field_subject_name' => $data['name'] ?? '',
        'field_course_ref' => isset($data['courseId']) ? ['target_id' => $data['courseId']] : NULL,
      ]);
      $node->save();

      return new JsonResponse($this->formatSubject($node), 201);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Update a subject.
   */
  public function update($id, Request $request) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'subject') {
      return new JsonResponse(['error' => 'Subject not found'], 404);
    }

    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      if (isset($data['name'])) {
        $node->set('field_subject_name', $data['name']);
        $node->set('title', $data['name']);
      }
      if (isset($data['courseId'])) {
        $node->set('field_course_ref', ['target_id' => $data['courseId']]);
      }

      $node->save();

      return new JsonResponse($this->formatSubject($node));
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Delete a subject.
   */
  public function delete($id) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'subject') {
      return new JsonResponse(['error' => 'Subject not found'], 404);
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
   * Format subject data for API response.
   */
  private function formatSubject($node) {
    $course_ref = $node->get('field_course_ref')->target_id;

    return [
      'id' => (int) $node->id(),
      'name' => $node->get('field_subject_name')->value ?? '',
      'courseId' => $course_ref ? (int) $course_ref : NULL,
    ];
  }

}
