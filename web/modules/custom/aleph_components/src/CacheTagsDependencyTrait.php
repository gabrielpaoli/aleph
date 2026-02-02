<?php

namespace Drupal\aleph_components;

/**
 * Helper trait to add cache tags to the render arrays.
 */
trait CacheTagsDependencyTrait {

  /**
   * Add entity reference cache tags to given render array.
   *
   * @param string $fieldName
   *   Entity reference field name.
   * @param array $elements
   *   Render array.
   */
  public function addEntityReferenceFieldCacheTags($fieldName, &$elements) {
    if (empty($elements['#cache'])) {
      $elements['#cache'] = ['tags' => []];
    }

    if (!empty($elements['elements'][$fieldName]['#items'])) {
      $refs = $elements['elements'][$fieldName]['#items']->referencedEntities();
      foreach ($refs as $ref) {
        $elements['#cache']['tags'] = array_merge($elements['#cache']['tags'], $ref->getCacheTags());
      }
    }
  }

  /**
   * Add node list cache tags.
   *
   * @param array $elements
   *   Render array.
   */
  public function addNodeListCacheTags(&$elements) {
    if (empty($elements['#cache'])) {
      $elements['#cache'] = ['tags' => []];
    }
    $elements['#cache']['tags'][] = 'node_list';
  }

  /**
   * Add node list bundle cache tags.
   *
   * @param array $elements
   * @param array $bundles
   *   Render array.
   */
  public function addNodeListBundleCacheTags(&$elements, array $bundles = []) {
    if (empty($elements['#cache'])) {
      $elements['#cache'] = ['tags' => []];
    }

    foreach ($bundles as $bundle) {
      $elements['#cache']['tags'][] = "node_list:{$bundle}";
    }
  }

  /**
   * Add taxonomy list cache tags.
   *
   * @param array $elements
   *   Render array.
   */
  public function addTaxonomyListCacheTags(&$elements) {
    if (empty($elements['#cache'])) {
      $elements['#cache'] = ['tags' => []];
    }
    $elements['#cache']['tags'][] = 'taxonomy_term_list';
  }
}
