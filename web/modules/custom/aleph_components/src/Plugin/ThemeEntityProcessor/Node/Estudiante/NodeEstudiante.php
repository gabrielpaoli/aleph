<?php

namespace Drupal\aleph_components\Plugin\ThemeEntityProcessor\Node\Estudiante;

use Drupal\handlebars_theme_handler\Plugin\ThemeEntityProcessorBase;

/**
 * Returns the structured data of an entity.
 *
 * @ThemeEntityProcessor(
 *   id = "node__estudiante",
 *   label = @Translation("Node: Estudiante: Full"),
 *   entity_type = "node",
 *   bundle = "estudiante",
 *   view_mode = "default"
 * )
 */
class NodeEstudiante extends ThemeEntityProcessorBase {

  /**
   * {@inheritdoc}
   */
  public function preprocessItemData(&$variables) {
    /** @var \Drupal\node\NodeInterface $node */
    $node = $variables['elements']['#node'];
    $variables['data'] = [
      'nombre' => $node->getTitle(),
      'apellido' => $this->themeFieldProcessorManager->getFieldData($variables['elements']['field_apellido_s']),
      'dni' => $this->themeFieldProcessorManager->getFieldData($variables['elements']['field_dni']),
      'notas' => $this->themeFieldProcessorManager->getFieldData($variables['elements']['field_notas']),
      'faltas' => '8',
    ];
  }
}
