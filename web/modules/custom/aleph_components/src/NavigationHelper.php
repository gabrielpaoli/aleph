<?php

namespace Drupal\aleph_components;

use Drupal\Component\Utility\UrlHelper;
use Drupal\Component\Utility\Xss;
use Drupal\Core\Menu\MenuLinkTreeInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\file\Entity\File;
use Drupal\image\Entity\ImageStyle;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\Core\Menu\MenuLinkBase;
use Drupal\Core\Menu\MenuTreeParameters;
use Drupal\Core\Url;
use Drupal\user\Entity\User;

/**
 * Class Helper.
 */
class NavigationHelper implements NavigationHelperInterface {

  const MAX_MENU_LEVEL = 3;

  protected $menuLinkTree;
  protected $aliasManager;
  protected $isFrontPage;
  protected $urlSegmentHelper;
  protected $languageManager;

  public function __construct(
    MenuLinkTreeInterface $menu_link_tree,
    AliasManagerInterface $alias_manager,
    PathMatcherInterface $path_matcher,
    UrlSegmentHelper $urlSegmentHelper,
    LanguageManagerInterface $language_manager
  ) {
    $this->menuLinkTree = $menu_link_tree;
    $this->aliasManager = $alias_manager;
    $this->isFrontPage = $path_matcher->isFrontPage();
    $this->urlSegmentHelper = $urlSegmentHelper;
    $this->languageManager = $language_manager;
  }

  public function getMenuItems(string $menuName = 'main'): array {
    $menuTreeParameters = new MenuTreeParameters();
    $menuTreeParameters->setMaxDepth(self::MAX_MENU_LEVEL);
    $menuTreeParameters->onlyEnabledLinks();
    $menuItems = $this->menuLinkTree->load($menuName, $menuTreeParameters);

    $manipulators = [
      ['callable' => 'menu.default_tree_manipulators:checkNodeAccess'],
      ['callable' => 'menu.default_tree_manipulators:checkAccess'],
      ['callable' => 'menu.default_tree_manipulators:generateIndexAndSort'],
      ['callable' => 'aleph_components.default_tree_manipulators:checkAccess'],
    ];

    $menuItems = $this->menuLinkTree->transform($menuItems, $manipulators);

    return $this->processMenuItems($menuItems);
  }

  public function getIsFrontPage(): bool {
    return $this->isFrontPage;
  }

  protected function getUrlAlias(MenuLinkBase $menuLink, $languageId = NULL) {
    if ($menuLink->getRouteName()) {
      $urlObject = Url::fromRoute($menuLink->getRouteName(), $menuLink->getRouteParameters());
      $defaultLanguage = $this->languageManager->getDefaultLanguage()->getId();

      if ($defaultLanguage === $languageId) {
        return $this->aliasManager->getAliasByPath('/' . $urlObject->getInternalPath(),
          \Drupal::languageManager()->getCurrentLanguage()->getId());
      }
      $path = $this->aliasManager->getAliasByPath('/' . $urlObject->getInternalPath(), $languageId);
      return '/' . $languageId . $path;
    }

    return $menuLink->getUrlObject()->toString();
  }

  protected function getLinkClass(MenuLinkBase $menuLink) {
    $options = $menuLink->getOptions();
    return !empty($options['attributes']['class']) ? $options['attributes']['class'] : NULL;
  }

  protected function isCookiesPolicyEnabled(MenuLinkBase $menuLink) {
    $options = $menuLink->getOptions();
    return !empty($options['attributes']['cookies_policy']);
  }

  protected function getMenuLinkId(MenuLinkBase $menuLink) {
    $mlid = NULL;
    $metadata = $menuLink->getMetaData();
    if (!empty($metadata['entity_id'])) {
      $mlid = $metadata['entity_id'];
    }
    return $mlid;
  }

  protected function processMenuItems(array $menuItems) {
    $items = [];
    $currentPath = Url::fromRoute('<current>')->toString();
    $languageId = $this->languageManager->getCurrentLanguage()->getId();
    $defaultLanguage = $this->languageManager->getDefaultLanguage()->getId();
    $user = User::load(\Drupal::currentUser()->id());

    foreach ($menuItems as $menuItem) {
      $link = $menuItem->link;
      $menuLinkId = $this->getMenuLinkId($link);

      if (!$menuLinkId) {
        \Drupal::logger('aleph_components')->warning('Menu link ID is null for link: ' . $link->getTitle());
        $menuImage = null;
        $rolAllowed = true;
      } else {
        $rolAllowed = $this->getMenuRolAccess($menuLinkId, $languageId, $user);
        $menuImage = $this->getMenuImage($menuLinkId, $languageId);
      }

      if ($menuItem->access->isAllowed() && $rolAllowed) {
        $linkPath = $this->getUrlAlias($link, $languageId);
        $options = $link->getOptions();
        if (!empty($options['fragment'])) {
          $linkPath .= '#' . $options['fragment'];
        }

        $activeLink = $currentPath == $linkPath;
        if ($defaultLanguage === $languageId) {
          $activeLink = $currentPath == LanguageHelper::getLanguagePrefix() . $linkPath;
        }

        $menuItemId = $this->urlSegmentHelper->cleanUp($link->getTitle(), 'menu-item');
        $target = UrlHelper::isExternal($linkPath) ? '_blank' : '';

        $item = [
          'elementId' => $menuLinkId ? ($menuItemId . '-' . $menuLinkId) : $menuItemId,
          'href' => $linkPath,
          'label' => $link->getTitle(),
          'description' => $link->getDescription(),
          'active' => $activeLink,
          'highlight' => $link->isExpanded(),
          'class' => $this->getLinkClass($link),
          'target' => $target,
          'image' => $menuImage,
        ];

        if ($menuItem->hasChildren) {
          $item['sublinks'] = $this->processMenuItems($menuItem->subtree);
        }

        $items[] = $item;
      }
    }

    return $items;
  }

  protected function getMenuImage($menuLinkId, $languageId) {
    if (!$menuLinkId) {
      return null;
    }

    $fields = \Drupal::entityTypeManager()->getStorage('menu_link_content')->load($menuLinkId);
    if (!$fields) {
      \Drupal::logger('aleph_components')->warning('Menu link not found in getMenuImage: ' . $menuLinkId);
      return null;
    }

    $image = null;

    if ($fields->hasField('field_menu_imagen')) {
      if ($fields->hasTranslation($languageId)) {
        $fields = $fields->getTranslation($languageId);
      }
      $menu_image = $fields->get('field_menu_imagen')->getValue();
      if (!empty($menu_image)) {
        $file = File::load(reset($menu_image)['target_id']);
        if ($file) {
          $image_uri = $file->getFileUri();
          $style = ImageStyle::load('convert_menu_webp');
          $url = $style ? $style->buildUrl($image_uri) : \Drupal::service('file_url_generator')->generateAbsoluteString($image_uri);
          $image['image_src'] = $url;
          $image['alt'] = Xss::filter($menu_image[0]['alt']);
        }
      }
    }

    return $image;
  }

  protected function getMenuRolAccess($menuLinkId, $languageId, $user) {
    if (!$menuLinkId) {
      return true;
    }

    $fields = \Drupal::entityTypeManager()->getStorage('menu_link_content')->load($menuLinkId);
    if (!$fields) {
      \Drupal::logger('aleph_components')->warning('Menu link not found in getMenuRolAccess: ' . $menuLinkId);
      return true;
    }

    $access = true;

    if ($fields->hasField('field_menu_roles')) {
      if ($fields->hasTranslation($languageId)) {
        $fields = $fields->getTranslation($languageId);
      }

      $menu_roles = $fields->get('field_menu_roles')->getValue();

      if (!empty($menu_roles)) {
        $userRoles = $user->getRoles();
        foreach ($menu_roles as $menu_rol) {
          if (!in_array($menu_rol['target_id'], $userRoles)) {
            $access = false;
          }
        }
      }
    }

    return $access;
  }

}
