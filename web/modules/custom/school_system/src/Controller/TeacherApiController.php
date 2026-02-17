<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Teacher API endpoints.
 */
class TeacherApiController extends ControllerBase {

  /**
   * Get all teachers.
   */
  public function getAll(Request $request) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'teacher')
      ->condition('status', 1)
      ->accessCheck(FALSE);

    $nids = $query->execute();
    $teachers = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $teachers[] = $this->formatTeacher($node);
      }
    }

    return new JsonResponse($teachers);
  }

  /**
   * Get one teacher.
   */
  public function getOne($id) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'teacher') {
      return new JsonResponse(['error' => 'Teacher not found'], 404);
    }

    return new JsonResponse($this->formatTeacher($node));
  }

  /**
   * Create a teacher.
   */
  public function createTeacher(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      // Preparar referencias de materias
      $subjects_refs = [];
      if (!empty($data['subjectIds']) && is_array($data['subjectIds'])) {
        foreach ($data['subjectIds'] as $subject_id) {
          $subjects_refs[] = ['target_id' => $subject_id];
        }
      }

      $node = Node::create([
        'type' => 'teacher',
        'title' => ($data['firstName'] ?? '') . ' ' . ($data['lastName'] ?? ''),
        'field_first_name' => $data['firstName'] ?? '',
        'field_last_name' => $data['lastName'] ?? '',
        'field_email' => $data['email'] ?? '',
        'field_subjects_ref' => $subjects_refs,
        'status' => 1,
      ]);

      $node->save();

      return new JsonResponse($this->formatTeacher($node), 201);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Update a teacher.
   */
  public function update($id, Request $request) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'teacher') {
      return new JsonResponse(['error' => 'Teacher not found'], 404);
    }

    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      if (isset($data['firstName'])) {
        $node->set('field_first_name', $data['firstName']);
      }
      if (isset($data['lastName'])) {
        $node->set('field_last_name', $data['lastName']);
      }
      if (isset($data['email'])) {
        $node->set('field_email', $data['email']);
      }
      if (isset($data['subjectIds']) && is_array($data['subjectIds'])) {
        $subjects_refs = [];
        foreach ($data['subjectIds'] as $subject_id) {
          $subjects_refs[] = ['target_id' => $subject_id];
        }
        $node->set('field_subjects_ref', $subjects_refs);
      }

      // Actualizar título
      $first_name = $node->get('field_first_name')->value ?? '';
      $last_name = $node->get('field_last_name')->value ?? '';
      $node->set('title', trim($first_name . ' ' . $last_name));
      
      $node->save();

      return new JsonResponse($this->formatTeacher($node));
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Delete a teacher.
   */
  public function delete($id) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'teacher') {
      return new JsonResponse(['error' => 'Teacher not found'], 404);
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
   * Format teacher data for API response.
   */
  private function formatTeacher($node) {
    $firstName = $node->get('field_first_name')->value ?? '';
    $lastName = $node->get('field_last_name')->value ?? '';
    $title = $node->getTitle();
    
    // If fields are empty, try to extract from title
    if (empty($firstName) && empty($lastName) && !empty($title)) {
      $parts = explode(' ', trim($title), 2);
      $firstName = $parts[0] ?? '';
      $lastName = $parts[1] ?? '';
    }

    // Obtener IDs de materias
    $subject_ids = [];
    $subjects_field = $node->get('field_subjects_ref');
    if ($subjects_field) {
      foreach ($subjects_field as $item) {
        if ($item->target_id) {
          $subject_ids[] = (int) $item->target_id;
        }
      }
    }

    return [
      'id' => (int) $node->id(),
      'firstName' => $firstName,
      'lastName' => $lastName,
      'email' => $node->get('field_email')->value ?? '',
      'subjectIds' => $subject_ids,
    ];
  }

}
