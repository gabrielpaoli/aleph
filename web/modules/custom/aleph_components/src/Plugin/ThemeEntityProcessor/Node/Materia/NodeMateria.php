<?php

namespace Drupal\aleph_components\Plugin\ThemeEntityProcessor\Node\Materia;

use Drupal\handlebars_theme_handler\Plugin\ThemeEntityProcessorBase;

/**
 * Returns the structured data of an entity.
 *
 * @ThemeEntityProcessor(
 *   id = "node__materia",
 *   label = @Translation("Node: Materia: Full"),
 *   entity_type = "node",
 *   bundle = "materia",
 *   view_mode = "default"
 * )
 */
class NodeMateria extends ThemeEntityProcessorBase {

  /**
   * {@inheritdoc}
   */
  public function preprocessItemData(&$variables) {
    /** @var \Drupal\node\NodeInterface $node */
    $node = $variables['elements']['#node'];
    $variables['data'] = [
      'titulo' => $node->getTitle(),
    ];
  }
}
