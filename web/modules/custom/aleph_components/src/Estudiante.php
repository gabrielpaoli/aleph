<?php

namespace Drupal\aleph_components;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * This is a custom service class for My Custom Module.
 */
class Estudiante {

  /**
   * The database connection.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * @param Connection $database
   * @param EntityTypeManagerInterface $entity_type_manager
   */
  public function __construct(Connection $database, EntityTypeManagerInterface $entity_type_manager) {
    $this->database = $database;
    $this->entityTypeManager = $entity_type_manager;
  }

  public function getEstudianteCurso($idEstudiante) {
    $entityStorage = $this->entityTypeManager->getStorage('node');
    $nombre_curso = '';

    $curso = $entityStorage->loadByProperties([
      'type' => 'curso',
      'field_estudiantes' => $idEstudiante,
    ]);

    if (!empty($curso)) {
      $curso = reset($curso);
      $nombre_curso = $curso->getTitle();
    }

    return $nombre_curso;
  }

}
