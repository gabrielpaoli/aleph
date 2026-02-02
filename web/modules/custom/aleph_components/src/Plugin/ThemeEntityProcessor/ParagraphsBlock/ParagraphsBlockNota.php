<?php

namespace Drupal\aleph_components\Plugin\ThemeEntityProcessor\ParagraphsBlock;

use Drupal\handlebars_theme_handler\Plugin\ThemeEntityProcessorBase;

/**
 * Returns the structured data of an entity.
 *
 * @ThemeEntityProcessor(
 *   id = "nota",
 *   label = @Translation("Nota"),
 *   entity_type = "paragraph",
 *   bundle = "nota",
 *   view_mode = "default"
 * )
 */
class ParagraphsBlockNota extends ThemeEntityProcessorBase {

  /**
   * {@inheritdoc}
   */
  public function preprocessItemData(&$variables) {
    $p = $variables['elements']['#paragraph'];

    $variables['data'] = [
      'component' => $p->bundle(),
      'component_id' => $p->id(),
      'descripcion_corta' => $this->themeFieldProcessorManager->getFieldData($variables['elements']['field_descripcion_corta']),
      'fecha' => $this->themeFieldProcessorManager->getFieldData($variables['elements']['field_fecha']),
      'materia' => $this->themeFieldProcessorManager->getFieldData($variables['elements']['field_materia']),
      'notas' => $this->themeFieldProcessorManager->getFieldData($variables['elements']['field_nota']),
    ];

  }
}
