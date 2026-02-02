<?php

namespace Drupal\aleph_components;

/**
 * Interface HelperInterface.
 */
interface NavigationHelperInterface {

  /**
   * Load first level of menu links from main menu.
   *
   * @param string $menuName
   *
   * @return array
   */
  public function getMenuItems(string $menuName = 'main'): array;

  /**
   * Is the current page the home page?
   *
   * @return bool
   */
  public function getIsFrontPage(): bool;

}
