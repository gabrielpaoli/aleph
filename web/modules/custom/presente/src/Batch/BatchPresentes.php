<?php

namespace Drupal\presente\Batch;

use Drupal\presente\Entity\Presente;

class BatchPresentes {

  /**
  * Batch process callback function.
  */
  public static function processItem($item_id, &$context) {
    $entityTypeManager = \Drupal::entityTypeManager();
    $entityStorage = $entityTypeManager->getStorage('presente');

    $presentes = $entityStorage->loadByProperties([
      'field_fecha' => $item_id['fecha'],
      'field_eid' => $item_id['estudiante_id'],
    ]);

    $presente = reset($presentes);

    if ($presente) {
      if($presente->get('field_presente') != $item_id['is_checked']) {
        $presente->set('field_presente', $item_id['is_checked']);
        $presente->save();
      }
    }else{
      $entity = Presente::create([
          'field_presente' => $item_id['is_checked'],
          'field_eid' => $item_id['estudiante_id'],
          'field_fecha' => $item_id['fecha'],
        ]
      );
      $entity->save();
    }

    $context['results'][] = $item_id["estudiante_id"];
    $context['message'] = t('Processing item @id', ['@id' => $item_id["estudiante_id"]]);
  }

  /**
  * Batch finished callback function.
  */
  public static function finishBatch($success, $results, $operations) {
    $messenger = \Drupal::messenger();
    if ($success) {
      $num_operations = count($operations);
      $messenger->addMessage(t('@count items processed successfully.', ['@count' => $num_operations]));
    } else {
      $messenger->addError(t('Finished with errors.'));
    }
  }
}
