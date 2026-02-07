<?php

namespace Drupal\presente\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;

class PresenteAdminSendEmailForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'enviar_ausentes_admin_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['description'] = [
      '#type' => 'markup',
      '#markup' => $this->t('<p>Cuando haga click en "enviar ausentes" se le enviarará un mail a las familias informando el ausente del día</p>'),
    ];


    $presente = \Drupal::service('presente.data');
    $estudiante = \Drupal::service('aleph_components.estudiante');

    $ausentes = $presente->getListaDeAusentesDelDia();

    $header = [
      'curso' => $this->t('Curso'),
      'name' => $this->t('Nombre y Apellido'),
      'dni' => $this->t('DNI'),
      'mail' => $this->t('Email'),
    ];

    $rows = [];

    foreach ($ausentes as $ausente) {
      $row = [
        'curso' => $estudiante->getEstudianteCurso($ausente->id()),
        'name' => $ausente->getTitle() . ' ' . $ausente->get('field_apellido_s')->value,
        'dni' => $ausente->get('field_dni')->value,
        'mail' => $ausente->get('field_mail_de_la_familia')->value,
      ];
      $rows[] = $row;
    }

    $form['data_table'] = [
      '#type' => 'table',
      '#header' => $header,
      '#rows' => $rows,
      '#empty' => $this->t('No Hay ausentes.'),
      '#responsive' => TRUE,
    ];


    $form['actions']['#type'] = 'actions';
    $form['actions']['custom_button'] = [
      '#type' => 'submit',
      '#value' => $this->t('Enviar ausentes'),
      '#button_type' => 'primary', // Optional: applies the primary button style
      '#submit' => ['::customButtonSubmit'], // Define a custom submit handler
    ];

    return $form;
  }

  /**
   * Custom submit handler for the 'Perform Custom Action' button.
   */
  public function customButtonSubmit(array &$form, FormStateInterface $form_state) {
    $presente = \Drupal::service('presente.data');
    $ausentes = $presente->getListaDeAusentesDelDia();

    foreach ($ausentes as $ausente) {

      $mail = $ausente->get('field_mail_de_la_familia')->value;
      $nombre = $ausente->getTitle() . ' ' . $ausente->get('field_apellido_s')->value;

      $mailManager = \Drupal::service('plugin.manager.mail');
      $module = 'presente';
      $key = 'ausentes_email';
      $to = $mail;
      $params['message'] = 'Se ha registrado en el sistema que el estudiante ' . $nombre . ' no ingreso a la escuela el día de la fecha' ;
      $langcode = \Drupal::currentUser()->getPreferredLangcode();
      $send = true;

      $mailManager->mail($module, $key, $to, $langcode, $params, NULL, $send);

    }

    $this->messenger()->addStatus($this->t('Mails enviados.'));

  }

  /**
   * {@inheritdoc}
   * This is required by the FormBase but the specific custom button uses the custom handler above.
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {

  }
}
