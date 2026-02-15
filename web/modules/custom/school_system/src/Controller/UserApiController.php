<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\user\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for User management API endpoints.
 */
class UserApiController extends ControllerBase {

  /**
   * Test endpoint.
   */
  public function testEndpoint() {
    return new JsonResponse([
      'success' => TRUE,
      'message' => 'User API is working',
    ]);
  }

  /**
   * Get all teachers (docentes).
   */
  public function getTeachers() {
    try {
      // Query users with the 'docente' role
      $query = \Drupal::entityQuery('user')
        ->condition('roles', 'docente')
        ->accessCheck(FALSE);
      
      $uids = $query->execute();
      
      $users = [];
      if (!empty($uids)) {
        foreach ($uids as $uid) {
          $user = User::load($uid);
          if ($user && $user->id() > 0) {
            // Extract firstName and lastName from name or email
            $name = $user->getDisplayName();
            $email = $user->getEmail();
            
            $first_name = 'Unknown';
            $last_name = '';
            
            // Try to extract from name first
            if ($name && $name !== '') {
              $parts = explode(' ', trim($name));
              $first_name = $parts[0] ?? 'Unknown';
              $last_name = implode(' ', array_slice($parts, 1));
            }
            // Otherwise try to extract from email
            else if ($email && $email !== '') {
              $email_username = explode('@', $email)[0];
              $parts = explode('.', $email_username);
              $first_name = $parts[0] ?? 'Unknown';
              $last_name = $parts[1] ?? '';
            }
            
            $user_data = [
              'id' => (int)$user->id(),
              'name' => $name,
              'email' => $email,
              'firstName' => $first_name,
              'lastName' => $last_name,
              'roles' => $user->getRoles(),
            ];

            // Add subjects for docente role
            if ($user->hasField('field_subjects_ref')) {
              $subject_ids = [];
              $subjects = $user->get('field_subjects_ref')->referencedEntities();
              foreach ($subjects as $subject) {
                $subject_ids[] = (int)$subject->id();
              }
              $user_data['subjectIds'] = $subject_ids;
            }

            $users[] = $user_data;
          }
        }
      }

      return new JsonResponse($users);

    } catch (\Throwable $e) {
      \Drupal::logger('school_system')->error('getTeachers error: @msg', [
        '@msg' => $e->getMessage(),
      ]);
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Error: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Create a new teacher (docente).
   */
  public function createTeacher(Request $request) {
    try {
      $data = json_decode($request->getContent(), TRUE);

      if (empty($data)) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'Invalid request body',
        ], 400);
      }

      $email = $data['email'] ?? NULL;
      $password = $data['password'] ?? NULL;
      $name = $data['name'] ?? $email;

      if (!$email || !$password || !$name) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'Missing required fields: email, password, name',
        ], 400);
      }

      // Check existing user
      $existing = \Drupal::entityTypeManager()
        ->getStorage('user')
        ->loadByProperties(['mail' => $email]);

      if (!empty($existing)) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'User with this email already exists',
        ], 409);
      }

      // Create user with docente role
      $user = User::create([
        'name' => $name,
        'mail' => $email,
        'pass' => $password,
        'status' => TRUE,
      ]);

      $user->addRole('docente');

      // Add subjects if provided
      if (isset($data['subjectIds']) && !empty($data['subjectIds'])) {
        $subject_ids = $data['subjectIds'];
        if (!is_array($subject_ids)) {
          $subject_ids = [$subject_ids];
        }
        $user->set('field_subjects_ref', $subject_ids);
      }

      $user->save();

      $user_response = [
        'success' => TRUE,
        'id' => (int)$user->id(),
        'name' => $user->getDisplayName(),
        'email' => $user->getEmail(),
      ];

      return new JsonResponse($user_response, 201);

    } catch (\Throwable $e) {
      \Drupal::logger('school_system')->error('createTeacher error: @msg', [
        '@msg' => $e->getMessage(),
      ]);
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Error: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Update a teacher (docente).
   */
  public function updateTeacher($id, Request $request) {
    try {
      $user = User::load($id);

      if (!$user) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'Teacher not found',
        ], 404);
      }

      if (!$user->hasRole('docente')) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'User is not a teacher',
        ], 400);
      }

      $data = json_decode($request->getContent(), TRUE);

      if (!$data) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'Invalid request body',
        ], 400);
      }

      // Update fields
      if (isset($data['name'])) {
        $user->set('name', $data['name']);
      }

      if (isset($data['email'])) {
        // Check if email is already in use by another user
        $existing = \Drupal::entityTypeManager()
          ->getStorage('user')
          ->loadByProperties(['mail' => $data['email']]);

        if (!empty($existing)) {
          $existing_user = reset($existing);
          if ($existing_user->id() != $id) {
            return new JsonResponse([
              'success' => FALSE,
              'error' => 'Email already in use',
            ], 400);
          }
        }
        $user->set('mail', $data['email']);
      }

      if (isset($data['password']) && !empty($data['password'])) {
        $user->setPassword($data['password']);
      }

      if (isset($data['subjectIds']) && is_array($data['subjectIds'])) {
        $user->set('field_subjects_ref', $data['subjectIds']);
      }

      $user->save();

      $user_response = [
        'success' => TRUE,
        'id' => (int)$user->id(),
        'name' => $user->getDisplayName(),
        'email' => $user->getEmail(),
      ];

      return new JsonResponse($user_response);

    } catch (\Throwable $e) {
      \Drupal::logger('school_system')->error('updateTeacher error: @msg', [
        '@msg' => $e->getMessage(),
      ]);
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Error: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Get users by role.
   */
  public function getUsersByRole($role = NULL) {
    try {
      // Allow all users to access this endpoint
      $current_user = \Drupal::currentUser();
      
      if (empty($role)) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'Role is required',
        ], 400);
      }

      // Query users with the role
      $query = \Drupal::entityQuery('user')
        ->condition('roles', $role)
        ->accessCheck(FALSE);
      
      $uids = $query->execute();
      
      $users = [];
      if (!empty($uids)) {
        foreach ($uids as $uid) {
          $user = User::load($uid);
          if ($user && $user->id() > 0) {
            $user_data = [
              'id' => (int)$user->id(),
              'name' => $user->getDisplayName(),
              'email' => $user->getEmail(),
              'roles' => $user->getRoles(),
            ];

            // Add subjects for docente role
            if ($role === 'docente' && $user->hasField('field_subjects_ref')) {
              $subject_ids = [];
              $subjects = $user->get('field_subjects_ref')->referencedEntities();
              foreach ($subjects as $subject) {
                $subject_ids[] = (int)$subject->id();
              }
              $user_data['subjectIds'] = $subject_ids;
            }

            $users[] = $user_data;
          }
        }
      }

      return new JsonResponse([
        'success' => TRUE,
        'role' => $role,
        'users' => $users,
        'total' => count($users),
      ]);

    } catch (\Throwable $e) {
      \Drupal::logger('school_system')->error('getUsersByRole error: @msg', [
        '@msg' => $e->getMessage(),
      ]);
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Error: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Create a new user.
   */
  public function createUser(Request $request) {
    try {
      $data = json_decode($request->getContent(), TRUE);

      if (empty($data)) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'Invalid request body',
        ], 400);
      }

      $email = $data['email'] ?? NULL;
      $password = $data['password'] ?? NULL;
      $name = $data['name'] ?? $email;
      $role = $data['role'] ?? NULL;

      if (!$email || !$password || !$role) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'Missing required fields: email, password, name, role',
        ], 400);
      }

      // Check existing user
      $existing = \Drupal::entityTypeManager()
        ->getStorage('user')
        ->loadByProperties(['mail' => $email]);

      if (!empty($existing)) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'User already exists',
        ], 409);
      }

      // Create user
      $user = User::create([
        'name' => $name,
        'mail' => $email,
        'pass' => $password,
        'status' => TRUE,
      ]);

      $user->addRole($role);

      // Add subjects for docente role
      if ($role === 'docente' && isset($data['subjectIds']) && !empty($data['subjectIds'])) {
        $subject_ids = $data['subjectIds'];
        if (!is_array($subject_ids)) {
          $subject_ids = [$subject_ids];
        }
        $user->set('field_subjects_ref', $subject_ids);
      }

      $user->save();

      $user_response = [
        'id' => (int)$user->id(),
        'name' => $user->getDisplayName(),
        'email' => $user->getEmail(),
        'role' => $role,
      ];

      // Add subjects to response for docente
      if ($role === 'docente' && $user->hasField('field_subjects_ref')) {
        $subject_ids = [];
        $subjects = $user->get('field_subjects_ref')->referencedEntities();
        foreach ($subjects as $subject) {
          $subject_ids[] = (int)$subject->id();
        }
        $user_response['subjectIds'] = $subject_ids;
      }

      return new JsonResponse([
        'success' => TRUE,
        'message' => 'User created',
        'user' => $user_response,
      ], 201);

    } catch (\Throwable $e) {
      \Drupal::logger('school_system')->error('createUser error: @msg', [
        '@msg' => $e->getMessage(),
      ]);
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Error: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Update user details.
   */
  public function updateUser(Request $request, $user_id) {
    try {
      $data = json_decode($request->getContent(), TRUE);

      if (empty($data)) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'Invalid request body',
        ], 400);
      }

      $user = User::load($user_id);
      if (!$user) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'User not found',
        ], 404);
      }

      // Update name if provided
      if (isset($data['name']) && !empty($data['name'])) {
        $user->setDisplayName($data['name']);
      }

      // Update email if provided
      if (isset($data['email']) && !empty($data['email'])) {
        // Check if email is already used
        $existing = \Drupal::entityTypeManager()
          ->getStorage('user')
          ->loadByProperties(['mail' => $data['email']]);

        if (!empty($existing)) {
          $existing_user = reset($existing);
          if ($existing_user->id() !== $user->id()) {
            return new JsonResponse([
              'success' => FALSE,
              'error' => 'Email already in use',
            ], 409);
          }
        }

        $user->setEmail($data['email']);
      }

      // Update password if provided
      if (isset($data['password']) && !empty($data['password'])) {
        $user->setPassword($data['password']);
      }

      // Update role if provided
      if (isset($data['role']) && !empty($data['role'])) {
        $new_role = $data['role'];
        // Remove old school roles
        $school_roles = ['preceptor', 'docente', 'parent', 'directivo'];
        foreach ($school_roles as $role) {
          $user->removeRole($role);
        }
        // Add new role
        $user->addRole($new_role);
      }

      // Update subjects for docente role
      $current_roles = $user->getRoles();
      if (in_array('docente', $current_roles) && isset($data['subjectIds'])) {
        $subject_ids = $data['subjectIds'];
        if (!is_array($subject_ids)) {
          $subject_ids = [$subject_ids];
        }
        $user->set('field_subjects_ref', $subject_ids);
      }

      $user->save();

      $user_response = [
        'id' => (int)$user->id(),
        'name' => $user->getDisplayName(),
        'email' => $user->getEmail(),
        'roles' => $user->getRoles(),
      ];

      // Add subjects to response if docente
      if (in_array('docente', $current_roles) && $user->hasField('field_subjects_ref')) {
        $subject_ids = [];
        $subjects = $user->get('field_subjects_ref')->referencedEntities();
        foreach ($subjects as $subject) {
          $subject_ids[] = (int)$subject->id();
        }
        $user_response['subjectIds'] = $subject_ids;
      }

      return new JsonResponse([
        'success' => TRUE,
        'message' => 'User updated',
        'user' => $user_response,
      ]);

    } catch (\Throwable $e) {
      \Drupal::logger('school_system')->error('updateUser error: @msg', [
        '@msg' => $e->getMessage(),
      ]);
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Error: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Update user role.
   */
  public function updateUserRole(Request $request, $user_id) {
    try {
      $data = json_decode($request->getContent(), TRUE);

      if (empty($data)) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'Invalid request body',
        ], 400);
      }

      $new_role = $data['role'] ?? NULL;
      if (!$new_role) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'Role is required',
        ], 400);
      }

      $user = User::load($user_id);
      if (!$user) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'User not found',
        ], 404);
      }

      // Remove school roles and add new one
      $school_roles = ['preceptor', 'docente', 'parent', 'directivo'];
      foreach ($school_roles as $r) {
        $user->removeRole($r);
      }

      $user->addRole($new_role);
      $user->save();

      return new JsonResponse([
        'success' => TRUE,
        'message' => 'Role updated',
        'user' => [
          'id' => (int)$user->id(),
          'email' => $user->getEmail(),
          'roles' => $user->getRoles(),
        ],
      ]);

    } catch (\Throwable $e) {
      \Drupal::logger('school_system')->error('updateUserRole error: @msg', [
        '@msg' => $e->getMessage(),
      ]);
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Error: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Delete a user.
   */
  public function deleteUser($user_id) {
    try {
      $user = User::load($user_id);
      if (!$user) {
        return new JsonResponse([
          'success' => FALSE,
          'error' => 'User not found',
        ], 404);
      }

      $user->delete();

      return new JsonResponse([
        'success' => TRUE,
        'message' => 'User deleted',
      ]);

    } catch (\Throwable $e) {
      \Drupal::logger('school_system')->error('deleteUser error: @msg', [
        '@msg' => $e->getMessage(),
      ]);
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'Error: ' . $e->getMessage(),
      ], 500);
    }
  }

}
