<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\user\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Authentication API endpoints.
 */
class AuthApiController extends ControllerBase {

  /**
   * Login endpoint.
   */
  public function login(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Invalid JSON',
      ], 400);
    }

    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Email y contraseña son requeridos',
      ], 400);
    }

    // Buscar usuario por email
    $users = \Drupal::entityTypeManager()
      ->getStorage('user')
      ->loadByProperties(['mail' => $email]);

    if (empty($users)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Credenciales inválidas',
      ], 401);
    }

    $user = reset($users);

    // Verificar contraseña
    $password_hasher = \Drupal::service('password');
    if (!$password_hasher->check($password, $user->getPassword())) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Credenciales inválidas',
      ], 401);
    }

    // *** IMPORTANTE: Iniciar sesión de Drupal ***
    user_login_finalize($user);

    // Determinar rol
    $role = 'user';
    if ($user->hasRole('administrator')) {
      $role = 'admin';
    }
    elseif ($user->hasRole('directivo')) {
      $role = 'directivo';
    }
    elseif ($user->hasRole('preceptor')) {
      $role = 'preceptor';
    }
    elseif ($user->hasRole('docente')) {
      $role = 'docente';
    }
    elseif ($user->hasRole('parent')) {
      $role = 'parent';
    }

    // Buscar estudiante(s) asociado(s) si es padre
    $student_id = NULL;
    $student_ids = []; // Array de todos los estudiantes del padre
    if ($role === 'parent') {
      $query = \Drupal::entityQuery('node')
        ->condition('type', 'student')
        ->condition('field_parent_email', $email)
        ->accessCheck(FALSE); // No check access - let parent see all their children
      $ids = $query->execute();
      if (!empty($ids)) {
        $student_ids = array_values(array_map('intval', $ids));
        $student_id = reset($student_ids); // El primero como principal
      }
    }

    // Obtener materias si es docente
    $subject_ids = [];
    if ($role === 'docente' && $user->hasField('field_subjects_ref')) {
      $subjects = $user->get('field_subjects_ref')->referencedEntities();
      foreach ($subjects as $subject) {
        $subject_ids[] = (int) $subject->id();
      }
    }

    // Obtener el session ID como token
    $session_id = \Drupal::service('session')->getId();

    return new JsonResponse([
      'success' => TRUE,
      'token' => $session_id,
      'user' => [
        'id' => (int) $user->id(),
        'email' => $user->getEmail(),
        'role' => $role,
        'studentId' => $student_id,
        'studentIds' => $student_ids,
        'subjectIds' => $subject_ids,
        'schoolId' => 1,
      ],
    ]);
  }

  /**
   * Logout endpoint.
   */
  public function logout(Request $request) {
    user_logout();
    return new JsonResponse(['success' => TRUE]);
  }

  /**
   * Get current user endpoint.
   */
  public function getCurrentUser(Request $request) {
    $current_user = \Drupal::currentUser();

    if ($current_user->isAnonymous()) {
      return new JsonResponse(NULL, 401);
    }

    $user = User::load($current_user->id());

    if (!$user) {
      return new JsonResponse(NULL, 401);
    }

    $role = 'user';
    if ($user->hasRole('administrator')) {
      $role = 'admin';
    }
    elseif ($user->hasRole('directivo')) {
      $role = 'directivo';
    }
    elseif ($user->hasRole('preceptor')) {
      $role = 'preceptor';
    }
    elseif ($user->hasRole('docente')) {
      $role = 'docente';
    }
    elseif ($user->hasRole('parent')) {
      $role = 'parent';
    }

    $student_id = NULL;
    $student_ids = []; // Array de todos los estudiantes del padre
    if ($role === 'parent') {
      $query = \Drupal::entityQuery('node')
        ->condition('type', 'student')
        ->condition('field_parent_email', $user->getEmail())
        ->accessCheck(FALSE); // No check access - let parent see all their children
      $ids = $query->execute();
      if (!empty($ids)) {
        $student_ids = array_values(array_map('intval', $ids));
        $student_id = reset($student_ids); // El primero como principal
      }
    }

    // Obtener materias si es docente
    $subject_ids = [];
    if ($role === 'docente' && $user->hasField('field_subjects_ref')) {
      $subjects = $user->get('field_subjects_ref')->referencedEntities();
      foreach ($subjects as $subject) {
        $subject_ids[] = (int) $subject->id();
      }
    }

    return new JsonResponse([
      'id' => (int) $user->id(),
      'email' => $user->getEmail(),
      'role' => $role,
      'studentId' => $student_id,
      'studentIds' => $student_ids,
      'subjectIds' => $subject_ids,
      'schoolId' => 1,
    ]);
  }

}
