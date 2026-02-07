<?php

namespace Drupal\presente;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * This is a custom service class for My Custom Module.
 */
class Presente {

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

  private function getIds($estudiantesIds){
    $ids = [];
    foreach($estudiantesIds as $estudianteId){
      $ids[] = $estudianteId["target_id"];
    }
    return $ids;
  }

  public function getEstudiantes($estudiantesIds){
    $ids = $this->getIds($estudiantesIds);

    $estudiantesDb = $this->entityTypeManager->getStorage('node')->loadMultiple($ids);
    $estudiantes = [];

    foreach($estudiantesDb as $estudianteDb) {
      $estudiantes[$estudianteDb->id()] = $estudianteDb->getTitle() . ' ' . $estudianteDb->get('field_apellido_s')->value;
    }
    return $estudiantes;
  }

  public function getPresentes($estudiantesIds){
    $data = [];
    $ids = $this->getIds($estudiantesIds);

    $entityStorage = $this->entityTypeManager->getStorage('presente');

    if(!empty($ids)){
      $presentes = $entityStorage->loadByProperties([
        'field_estudiante' => $ids,
      ]);

      foreach($presentes as $presente) {
        $fecha = $presente->get('field_fecha')->value;
        $present = $presente->get('field_presente')->value;
        $estudiante = $presente->get('field_estudiante')->entity;

        $data[$estudiante->id()][$fecha][] = [
          'fecha' => $fecha,
          'presente' => $present,
          'estudiante' => $estudiante->id(),
        ];
      }

    }
    return $data;
  }

  public function getListaDeAusentesDelDia(){
    $estudiantesAusentes = [];
    $entityStorage = $this->entityTypeManager->getStorage('presente');

    $ausentes = $entityStorage->loadByProperties([
      'field_presente' => 0,
      'field_fecha' => date('Y-m-d'),
    ]);

    foreach($ausentes as $presente) {
      $estudiantesAusentes[] = $presente->get('field_estudiante')->entity;
    }

    return $estudiantesAusentes;

  }

}
