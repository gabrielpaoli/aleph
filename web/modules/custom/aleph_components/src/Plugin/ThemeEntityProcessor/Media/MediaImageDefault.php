<?php

namespace Drupal\aleph_components\Plugin\ThemeEntityProcessor\Media;

use Drupal\Component\Utility\Xss;
use Drupal\handlebars_theme_handler\Plugin\ThemeEntityProcessorBase;

/**
 * Returns the structured data of an entity.
 *
 * @ThemeEntityProcessor(
 *   id = "media__image__default",
 *   label = @Translation("Media Image"),
 *   entity_type = "media",
 *   bundle = "image",
 *   view_mode = "default"
 * )
 */
class MediaImageDefault extends ThemeEntityProcessorBase {

  /**
   * {@inheritdoc}
   */
  public function preprocessItemData(&$variables) {
    if (isset($variables['elements']['field_media_image'])) {
      $options = [];

      if (isset($variables['style'])) {
        $options['style'] = $variables['style'];
      }

      $image = $this->themeFieldProcessorManager->getFieldData($variables['elements']['field_media_image'], $options);
      $alt = Xss::filterAdmin($image['alt']);

      $variables['data'] = [
        'type' => 'image',
        'normal' => $image['url'],
        'url' => $image['url'],
        'small' => $image['url'],
        'alt' => $alt,
      ];

      $smallImage = $this->getSmallImage($variables);

      if ($smallImage) {
        $variables['data']['small'] = $smallImage['url'];
      }
    }
  }

  /**
   * Get the small image.
   *
   * @param $variables
   *
   * @return array|string
   * @throws \Exception
   */
  protected function getSmallImage($variables) {
    $options = [];

    $image = $variables['elements']['field_media_image'];

    if (isset($variables['elements']['field_small_image']['#items'])) {
      $image = $variables['elements']['field_small_image'];
    }

    if (isset($variables['style'])) {
      $options['style'] = $variables['style'];
    }

    if (isset($variables['small'])) {
      $options['style'] = $variables['small'];
    }

    return $this->themeFieldProcessorManager->getFieldData($image, $options);
  }

}
