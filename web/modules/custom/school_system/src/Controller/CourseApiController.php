<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Course API endpoints.
 */
class CourseApiController extends ControllerBase {

  /**
   * Get all courses.
   */
  public function getAll(Request $request) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'course')
      ->condition('status', 1)
      ->accessCheck(TRUE);

    $school_id = $request->query->get('schoolId');
    if ($school_id) {
      $query->condition('field_school_ref', $school_id);
    }

    $nids = $query->execute();
    $courses = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $courses[] = $this->formatCourse($node);
      }
    }

    return new JsonResponse($courses);
  }

  /**
   * Create a course.
   */
  public function createCourse(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      $node = Node::create([
        'type' => 'course',
        'title' => ($data['name'] ?? '') . ' - ' . ($data['shift'] ?? ''),
        'field_course_name' => $data['name'] ?? '',
        'field_shift' => $data['shift'] ?? '',
        'field_school_ref' => isset($data['schoolId']) ? ['target_id' => $data['schoolId']] : NULL,
      ]);
      $node->save();

      return new JsonResponse($this->formatCourse($node), 201);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Update a course.
   */
  public function update($id, Request $request) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'course') {
      return new JsonResponse(['error' => 'Course not found'], 404);
    }

    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      if (isset($data['name'])) {
        $node->set('field_course_name', $data['name']);
      }
      if (isset($data['shift'])) {
        $node->set('field_shift', $data['shift']);
      }
      if (isset($data['schoolId'])) {
        $node->set('field_school_ref', ['target_id' => $data['schoolId']]);
      }

      $name = $node->get('field_course_name')->value ?? '';
      $shift = $node->get('field_shift')->value ?? '';
      $node->set('title', trim($name . ' - ' . $shift));
      $node->save();

      return new JsonResponse($this->formatCourse($node));
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Delete a course.
   */
  public function delete($id) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'course') {
      return new JsonResponse(['error' => 'Course not found'], 404);
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
   * Format course data for API response.
   */
  private function formatCourse($node) {
    $school_ref = $node->get('field_school_ref')->target_id;

    return [
      'id' => (int) $node->id(),
      'name' => $node->get('field_course_name')->value ?? '',
      'shift' => $node->get('field_shift')->value ?? '',
      'schoolId' => $school_ref ? (int) $school_ref : NULL,
    ];
  }

}
