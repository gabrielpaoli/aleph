<?php

declare(strict_types=1);

namespace Drupal\presente;

use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Entity\EntityListBuilder;

/**
 * Provides a list controller for the presente entity type.
 */
final class PresenteListBuilder extends EntityListBuilder {

  /**
   * {@inheritdoc}
   */
  public function buildHeader(): array {
    $header['id'] = $this->t('ID');
    $header['id_estudiante'] = $this->t('ID Estudiante');
    $header['fecha'] = $this->t('Fecha');
    $header['presente'] = $this->t('Presente');
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   */
  public function buildRow(EntityInterface $entity): array {
    /** @var \Drupal\presente\PresenteInterface $entity */
    $row['id'] = $entity->id();
    $row['id_estudiante'] = $entity->get('field_estudiante')->entity->id();
    $row['fecha'] = $entity->get('field_fecha')->value;
    $row['presente'] = $entity->get('field_presente')->value;
    return $row + parent::buildRow($entity);
  }

}
