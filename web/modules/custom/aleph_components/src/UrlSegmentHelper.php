<?php

namespace Drupal\aleph_components;

use Drupal\Component\Utility\Html;
use Drupal\Core\Transliteration\PhpTransliteration;

class UrlSegmentHelper {


  protected $transliteration;

  public function __construct(PhpTransliteration $transliteration) {
    $this->transliteration = $transliteration;
  }

  /**
   * Get a clean string to use as url segment.
   *
   * @param $label
   * @param null $prefix
   *
   * @return string
   */
  public function cleanUp($label, $prefix = NULL) {
    $cleanedStr = Html::getId($this->transliteration->transliterate($label));

    if (!is_null($prefix)) {
      $cleanedStr = $prefix . '-' . $cleanedStr;
    }

    return $cleanedStr;
  }

}
