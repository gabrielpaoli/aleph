<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Student API endpoints.
 */
class StudentApiController extends ControllerBase {

  /**
   * Get all students.
   */
  public function getAll(Request $request) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'student')
      ->condition('status', 1)
      ->accessCheck(FALSE); // ← Cambiar a FALSE para bypass de permisos en lectura

    $course_id = $request->query->get('courseId');
    if ($course_id) {
      $query->condition('field_course_ref', $course_id);
    }

    $nids = $query->execute();
    $students = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $students[] = $this->formatStudent($node);
      }
    }

    return new JsonResponse($students);
  }

  /**
   * Get one student.
   */
  public function getOne($id) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'student') {
      return new JsonResponse(['error' => 'Student not found'], 404);
    }

    return new JsonResponse($this->formatStudent($node));
  }

  /**
   * Create a student.
   */
  public function createStudent(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    // Verificar permisos del usuario actual
    $current_user = \Drupal::currentUser();

    // Log para debug
    \Drupal::logger('school_system')->notice('Creating student - User: @user, ID: @id, Roles: @roles, Is Anonymous: @anon', [
      '@user' => $current_user->getAccountName(),
      '@id' => $current_user->id(),
      '@roles' => implode(', ', $current_user->getRoles()),
      '@anon' => $current_user->isAnonymous() ? 'YES' : 'NO',
    ]);

    if ($current_user->isAnonymous()) {
      return new JsonResponse([
        'error' => 'User not authenticated',
        'debug' => [
          'userId' => $current_user->id(),
          'isAnonymous' => true,
        ]
      ], 401);
    }

    try {
      $node = Node::create([
        'type' => 'student',
        'title' => ($data['firstName'] ?? '') . ' ' . ($data['lastName'] ?? ''),
        'field_first_name' => $data['firstName'] ?? '',
        'field_last_name' => $data['lastName'] ?? '',
        'field_parent_email' => $data['email'] ?? '',
        'field_course_ref' => isset($data['courseId']) ? ['target_id' => $data['courseId']] : NULL,
        'field_legajo' => $data['legajo'] ?? rand(1000, 9999),
        'uid' => $current_user->id(), // Asignar el usuario actual como autor
        'status' => 1,
      ]);

      // Intentar guardar sin verificar permisos
      $node->save();

      \Drupal::logger('school_system')->notice('Student created successfully: @id', [
        '@id' => $node->id(),
      ]);

      return new JsonResponse($this->formatStudent($node), 201);
    }
    catch (\Exception $e) {
      \Drupal::logger('school_system')->error('Error creating student: @message', [
        '@message' => $e->getMessage(),
      ]);

      return new JsonResponse([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
      ], 500);
    }
  }

  /**
   * Update a student.
   */
  public function update($id, Request $request) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'student') {
      return new JsonResponse(['error' => 'Student not found'], 404);
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
        $node->set('field_parent_email', $data['email']);
      }
      if (isset($data['courseId'])) {
        $node->set('field_course_ref', ['target_id' => $data['courseId']]);
      }

      $first_name = $node->get('field_first_name')->value ?? '';
      $last_name = $node->get('field_last_name')->value ?? '';
      $node->set('title', trim($first_name . ' ' . $last_name));
      $node->save();

      return new JsonResponse($this->formatStudent($node));
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Delete a student.
   */
  public function delete($id) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'student') {
      return new JsonResponse(['error' => 'Student not found'], 404);
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
   * Get all students of a parent by email.
   */
  public function getStudentsByParent($parent_email) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'student')
      ->condition('field_parent_email', $parent_email)
      ->condition('status', 1)
      ->accessCheck(FALSE);

    $nids = $query->execute();
    $students = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $students[] = $this->formatStudent($node);
      }
    }

    return new JsonResponse($students);
  }

  /**
   * Format student data for API response.
   */
  private function formatStudent($node) {
    $course_ref = $node->get('field_course_ref')->target_id ?? NULL;

    return [
      'id' => (int) $node->id(),
      'firstName' => $node->get('field_first_name')->value ?? '',
      'lastName' => $node->get('field_last_name')->value ?? '',
      'email' => $node->get('field_parent_email')->value ?? '',
      'courseId' => $course_ref ? (int) $course_ref : NULL,
      'legajo' => (int) ($node->get('field_legajo')->value ?? 0),
    ];
  }

}
