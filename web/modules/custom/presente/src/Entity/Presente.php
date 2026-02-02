<?php

declare(strict_types=1);

namespace Drupal\presente\Entity;

use Drupal\Core\Entity\Attribute\ContentEntityType;
use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\ContentEntityDeleteForm;
use Drupal\Core\Entity\Form\DeleteMultipleForm;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\presente\Form\PresenteForm;
use Drupal\presente\PresenteAccessControlHandler;
use Drupal\presente\PresenteInterface;
use Drupal\presente\PresenteListBuilder;
use Drupal\presente\Routing\PresenteHtmlRouteProvider;
use Drupal\views\EntityViewsData;

/**
 * Defines the presente entity class.
 */
#[ContentEntityType(
  id: 'presente',
  label: new TranslatableMarkup('Presente'),
  label_collection: new TranslatableMarkup('Presentes'),
  label_singular: new TranslatableMarkup('presente'),
  label_plural: new TranslatableMarkup('presentes'),
  entity_keys: [
    'id' => 'id',
    'label' => 'id',
    'uuid' => 'uuid',
  ],
  handlers: [
    'list_builder' => PresenteListBuilder::class,
    'views_data' => EntityViewsData::class,
    'access' => PresenteAccessControlHandler::class,
    'form' => [
      'add' => PresenteForm::class,
      'edit' => PresenteForm::class,
      'delete' => ContentEntityDeleteForm::class,
      'delete-multiple-confirm' => DeleteMultipleForm::class,
    ],
    'route_provider' => [
      'html' => PresenteHtmlRouteProvider::class,
    ],
  ],
  links: [
    'collection' => '/admin/content/presente',
    'add-form' => '/presente/add',
    'canonical' => '/presente/{presente}',
    'edit-form' => '/presente/{presente}',
    'delete-form' => '/presente/{presente}/delete',
    'delete-multiple-form' => '/admin/content/presente/delete-multiple',
  ],
  admin_permission: 'administer presente',
  base_table: 'presente',
  label_count: [
    'singular' => '@count presentes',
    'plural' => '@count presentes',
  ],
  field_ui_base_route: 'entity.presente.settings',
)]
class Presente extends ContentEntityBase implements PresenteInterface {

}
