<?php

namespace Drupal\whatsapp_notifier\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configuration form for WhatsApp Notifier (per-school / per-site).
 */
class WhatsappSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['whatsapp_notifier.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'whatsapp_notifier_settings_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('whatsapp_notifier.settings');

    $form['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('✅ Habilitar notificaciones por WhatsApp'),
      '#default_value' => $config->get('enabled') ?? FALSE,
      '#description' => $this->t('Activa o desactiva el envío de mensajes WhatsApp para esta escuela.'),
    ];

    $form['twilio'] = [
      '#type' => 'details',
      '#title' => $this->t('Credenciales de Twilio'),
      '#open' => TRUE,
    ];

    $form['twilio']['account_sid'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Account SID'),
      '#default_value' => $config->get('account_sid') ?? '',
      '#description' => $this->t('Tu Twilio Account SID (empieza con AC…). Se encuentra en https://console.twilio.com'),
      '#placeholder' => 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      '#required' => FALSE,
    ];

    $form['twilio']['auth_token'] = [
      '#type' => 'password',
      '#title' => $this->t('Auth Token'),
      '#default_value' => $config->get('auth_token') ?? '',
      '#description' => $this->t('Tu Twilio Auth Token. Déjalo en blanco para no modificarlo.'),
      '#placeholder' => '••••••••••••••••••••••••••••••••',
    ];

    $form['twilio']['from_number'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Número de origen WhatsApp'),
      '#default_value' => $config->get('from_number') ?? '',
      '#description' => $this->t('Número Twilio habilitado para WhatsApp en formato E.164 con prefijo. Ejemplo: <code>whatsapp:+14155238886</code>. Para el sandbox de Twilio usa <code>whatsapp:+14155238886</code>.'),
      '#placeholder' => 'whatsapp:+14155238886',
      '#required' => FALSE,
    ];

    $form['twilio']['school_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Nombre de la escuela'),
      '#default_value' => $config->get('school_name') ?? '',
      '#description' => $this->t('Se incluye en la firma de los mensajes enviados a los padres.'),
      '#placeholder' => 'Colegio San Martín',
    ];

    // Only show current token masked if already saved.
    if ($config->get('auth_token')) {
      $form['twilio']['auth_token']['#description'] .= ' ' . $this->t('<em>Ya hay un token guardado. Deja en blanco para mantenerlo.</em>');
    }

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $config = $this->config('whatsapp_notifier.settings');

    $config
      ->set('enabled', (bool) $form_state->getValue('enabled'))
      ->set('account_sid', trim($form_state->getValue('account_sid')))
      ->set('from_number', trim($form_state->getValue('from_number')))
      ->set('school_name', trim($form_state->getValue('school_name')));

    // Only overwrite token if a new one was provided.
    $new_token = trim($form_state->getValue('auth_token'));
    if (!empty($new_token)) {
      $config->set('auth_token', $new_token);
    }

    $config->save();

    parent::submitForm($form, $form_state);
  }

}
