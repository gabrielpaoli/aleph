<?php

namespace Drupal\school_system\Controller;

use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Excluded Date API endpoints.
 */
class ExcludedDateApiController {

  /**
   * Get all excluded dates.
   */
  public function getAll(Request $request) {
    $query = \Drupal::entityQuery('node')
      ->condition('type', 'excluded_date')
      ->condition('status', 1)
      ->sort('field_excluded_date', 'ASC')
      ->accessCheck(FALSE);

    // Optional year filter: only include excluded dates within the given year.
    $year = (int) $request->query->get('year', 0);
    if ($year > 0) {
      $start = $year . '-01-01';
      $end = $year . '-12-31';
      $query->condition('field_excluded_date', $start, '>=');
      $query->condition('field_excluded_date', $end, '<=');
    }

    // Pagination
    $page = (int) $request->query->get('page', 1);
    $limit = (int) $request->query->get('limit', 50);
    $offset = ($page - 1) * $limit;

    $count_query = clone $query;
    $total = $count_query->count()->execute();
    $pages = ceil($total / $limit);

    $query->range($offset, $limit);
    $nids = $query->execute();
    $excluded_dates = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $excluded_dates[] = $this->formatExcludedDate($node);
      }
    }

    return new JsonResponse([
      'items' => $excluded_dates,
      'total' => $total,
      'page' => $page,
      'limit' => $limit,
      'pages' => $pages,
    ]);
  }

  /**
   * Get excluded dates for a specific date range.
   */
  public function getByDateRange(Request $request) {
    $start_date = $request->query->get('startDate');
    $end_date = $request->query->get('endDate');

    if (!$start_date || !$end_date) {
      return new JsonResponse(['error' => 'startDate and endDate parameters required'], 400);
    }

    $query = \Drupal::entityQuery('node')
      ->condition('type', 'excluded_date')
      ->condition('status', 1)
      ->condition('field_excluded_date', $start_date, '>=')
      ->condition('field_excluded_date', $end_date, '<=')
      ->sort('field_excluded_date', 'ASC')
      ->accessCheck(FALSE);

    $nids = $query->execute();
    $excluded_dates = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $excluded_dates[] = $this->formatExcludedDate($node);
      }
    }

    return new JsonResponse($excluded_dates);
  }

  /**
   * Create an excluded date.
   */
  public function create(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    if (!$data || !isset($data['date'])) {
      return new JsonResponse(['error' => 'Date is required'], 400);
    }

    // Check if user has permission
    if (!\Drupal::currentUser()->hasPermission('create excluded_date content')) {
      return new JsonResponse(['error' => 'Unauthorized'], 403);
    }

    try {
      // Check if date already exists
      $query = \Drupal::entityQuery('node')
        ->condition('type', 'excluded_date')
        ->condition('field_excluded_date', $data['date'])
        ->accessCheck(FALSE);
      
      if ($query->count()->execute() > 0) {
        return new JsonResponse(['error' => 'Date already excluded'], 409);
      }

      $node = Node::create([
        'type' => 'excluded_date',
        'title' => 'Excluded: ' . $data['date'],
        'field_excluded_date' => $data['date'],
        'field_excluded_reason' => $data['reason'] ?? '',
      ]);
      $node->save();

      return new JsonResponse($this->formatExcludedDate($node), 201);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Delete an excluded date.
   */
  public function delete($id, Request $request) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'excluded_date') {
      return new JsonResponse(['error' => 'Excluded date not found'], 404);
    }

    // Check if user has permission
    if (!\Drupal::currentUser()->hasPermission('delete any excluded_date content')) {
      return new JsonResponse(['error' => 'Unauthorized'], 403);
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
   * Update an excluded date.
   */
  public function update($id, Request $request) {
    $node = Node::load($id);

    if (!$node || $node->bundle() !== 'excluded_date') {
      return new JsonResponse(['error' => 'Excluded date not found'], 404);
    }

    // Check if user has permission
    if (!\Drupal::currentUser()->hasPermission('edit any excluded_date content')) {
      return new JsonResponse(['error' => 'Unauthorized'], 403);
    }

    $data = json_decode($request->getContent(), TRUE);

    if (!$data) {
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    try {
      if (isset($data['date'])) {
        $node->set('field_excluded_date', $data['date']);
        $node->set('title', 'Excluded: ' . $data['date']);
      }
      if (isset($data['reason'])) {
        $node->set('field_excluded_reason', $data['reason']);
      }

      $node->save();

      return new JsonResponse($this->formatExcludedDate($node));
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Format excluded date data for API response.
   */
  private function formatExcludedDate($node) {
    return [
      'id' => (int) $node->id(),
      'date' => $node->get('field_excluded_date')->value ?? '',
      'reason' => $node->get('field_excluded_reason')->value ?? '',
    ];
  }

}
