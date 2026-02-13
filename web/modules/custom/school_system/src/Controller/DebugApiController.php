<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Debug controller to check current user permissions.
 */
class DebugApiController extends ControllerBase {

  /**
   * Check current user session and permissions.
   */
  public function checkSession() {
    $current_user = \Drupal::currentUser();
    
    $user = \Drupal\user\Entity\User::load($current_user->id());
    
    if (!$user) {
      return new JsonResponse([
        'authenticated' => FALSE,
        'error' => 'No user loaded',
      ]);
    }

    return new JsonResponse([
      'authenticated' => $current_user->isAuthenticated(),
      'uid' => $current_user->id(),
      'name' => $current_user->getAccountName(),
      'email' => $current_user->getEmail(),
      'roles' => $current_user->getRoles(),
      'has_manage_school_users' => $current_user->hasPermission('manage school users'),
      'all_permissions' => array_keys(\Drupal::service('user.permissions')->get()),
    ]);
  }

}
