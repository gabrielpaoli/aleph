<?php

namespace Drupal\presente\Form;

use DateInterval;
use DatePeriod;
use DateTime;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\node\Entity\Node;

class ListaPresentesForm extends FormBase {
  public function getFormId() {
    return 'presente_form';
  }

  public function buildForm(array $form, FormStateInterface $form_state, $curso = NULL, $anual = NULL) {

    //Hago un check para ver si el curso existe
    if($curso->getType() != 'curso'){
      $this->messenger()->addStatus($this->t('No es un curso'));
      return NULL;
    }else{
      $estudiantesIds = $curso->get('field_estudiantes')->getValue();
      $presente = \Drupal::service('presente.data');
    }

    //Obtengo los datos
    $estudiantes = $presente->getEstudiantes($estudiantesIds);
    $presentes = $presente->getPresentes($estudiantesIds);
    $dataDays = $this->getDataDays($anual);

    //Creo el form
    $header = ['estudiante' => $this->t('Estudiante')];
    $header += array_map(function ($dia) {
      return ['data' => $dia, 'class' => [ 'rotate-text' ]];
    }, $dataDays['dias_del_anio']);

    $form['asistencia'] = [
      '#type' => 'table',
      '#header' => $header,
      '#caption' => $this->t('Registro de asistencia anual por estudiante <b>' . $dataDays['nombre_del_mes'] . '</b>'),
      '#empty' => $this->t('No hay datos disponibles.'),
      '#attributes' => ['class' => ['overflow-auto table table-striped table-bordered table-condensed']],
      '#prefix' => '<div class="table table-responsive">',
      '#suffix' => '</div>',
    ];

    foreach ($estudiantes as $id_estudiante => $nombre_estudiante) {
      $form['asistencia'][$id_estudiante]['label'] = [
        '#plain_text' => $nombre_estudiante,
      ];

      foreach ($dataDays['dias_del_anio'] as $fecha => $dia_format) {
        $form['asistencia'][$id_estudiante][$fecha] = [
          '#type' => 'checkbox',
          '#default_value' => (!empty($presentes[$id_estudiante][$fecha])) ? $presentes[$id_estudiante][$fecha][0]["presente"] : 0,
          '#title' => $this->t('Grant @perm to @role', ['@perm' => $fecha, '@role' => $dia_format]),
          '#title_display' => 'invisible',
        ];
      }
    }

    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Guardar asistencia'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $values = $form_state->getValue('asistencia');
    $info = $this->getInfoList($values);
    $operations = [];

    for ($i = 0; $i < count($info); $i++) {
      $operations[] = [
        '\\Drupal\\presente\\Batch\\BatchPresentes::processItem',
        [$info[$i]]
      ];
    }

    $batch = [
      'title' => $this->t('Guardando lista de asistencia...'),
      'operations' => $operations,
      'finished' => '\\Drupal\\presente\\Batch\\BatchPresentes::finishBatch',
      'init_message' => $this->t('Starting processing'),
      'progress_message' => $this->t('Processed @current out of @total items.'),
      'error_message' => $this->t('An error occurred during processing.'),
    ];

    batch_set($batch);
  }

  private function getInfoList($values){
    $info = [];

    foreach ($values as $estudiante_id => $roles) {
      foreach ($roles as $fecha => $is_checked) {
        $info[] = [
          "fecha" => $fecha,
          "is_checked" => $is_checked,
          "estudiante" => Node::load($estudiante_id),
        ];
      }
    }
    return $info;
  }

  /**
   * @throws \DateMalformedStringException
   * @throws \DateMalformedPeriodStringException
   */
  private function getDiasExcluidos(){
    $days = [];

    $inicio = new DateTime( date('Y') . '-01-01');
    $fin = new DateTime( date('Y') . '-02-01');
    $intervalo = new DateInterval('P1D');
    $periodo = new DatePeriod($inicio, $intervalo, $fin);

    foreach ($periodo as $fecha) {
      $days[] = new DateTime($fecha->format('Y-m-d'));
    }

    $days[] = new DateTime(date('Y') . '-12-24');
    $days[] = new DateTime(date('Y') . '-12-25');
    $days[] = new DateTime(date('Y') . '-03-24');

    return $days;
  }

  private function getDataDays($anual){
    $date_formatter = \Drupal::service('date.formatter');
    $anio_actual = date('Y');
    $dias_del_anio = [];

    if($anual){
      $nombre_del_mes = '';
      $fecha_inicio = new \DateTime("$anio_actual-01-01");
      $fecha_fin = new \DateTime("$anio_actual-12-31");
      $format = 'd-m';
    }else{
      $nombre_del_mes = $date_formatter->format(time(), 'custom', 'F', NULL, 'es');
      $mes_actual = date('m');
      $dias_en_el_mes_actual = date('t');
      $fecha_inicio = new \DateTime("$anio_actual-$mes_actual-01");
      $fecha_fin = new \DateTime("$anio_actual-$mes_actual-$dias_en_el_mes_actual");
      $format = 'd';
    }

    while ($fecha_inicio <= $fecha_fin) {
      $diaSemana = $fecha_inicio->format('N');
      if ($diaSemana < 6 && !in_array($fecha_inicio, $this->getDiasExcluidos())) {
        $dias_del_anio[$fecha_inicio->format('Y-m-d')] = $fecha_inicio->format($format);
      }
      $fecha_inicio->modify('+1 day');
    }

    return [
      'nombre_del_mes' => $nombre_del_mes,
      'dias_del_anio' => $dias_del_anio,
    ];

  }

}
