<?php

namespace Drupal\aleph_components;

/**
 * Class LanguageHelper
 *
 * @package Drupal\starbucks_components
 */
class LanguageHelper {

  /**
   * Get current language prefix.
   *
   * @return string
   *   Current language prefix.
   */
  public static function getLanguagePrefix() {
    if ($prefixes = \Drupal::config('language.negotiation')
      ->get('url.prefixes')) {
      $language = \Drupal::languageManager()->getCurrentLanguage()->getId();
      return empty($prefixes[$language]) ? "" : "/" . $prefixes[$language];
    }
    return "";
  }

  /**
   * Get current language id.
   *
   * @return string
   *   Current language id.
   */
  public static function getLanguageId() {
    return \Drupal::languageManager()->getCurrentLanguage()->getId();
  }

}
