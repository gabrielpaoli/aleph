<?php

namespace Drupal\aleph_components\Plugin\ThemeFieldProcessor;

use Drupal\Core\Field\FieldItemInterface;
use Drupal\handlebars_theme_handler\Plugin\ThemeFieldProcessorBase;

/**
 * Returns the (structured) data of a field.
 *
 * @ThemeFieldProcessor(
 *   id = "float_field_type",
 *   label = @Translation("Float"),
 *   field_types = {
 *     "decimal"
 *   }
 * )
 */
class FieldFloat extends ThemeFieldProcessorBase {

  /**
   * {@inheritdoc}
   */
  protected function getItemData(FieldItemInterface $field, $options = []) {
    $data = $field->getValue();

    return $data;
  }
}
