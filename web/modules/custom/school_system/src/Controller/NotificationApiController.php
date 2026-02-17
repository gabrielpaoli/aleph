<?php

namespace Drupal\school_system\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for Notification API endpoints.
 */
class NotificationApiController extends ControllerBase {

  /**
   * Send absence emails to parents.
   */
  public function sendAbsenceEmails(Request $request) {
    $data = json_decode($request->getContent(), TRUE);
    $date = $data['date'];
    $student_ids = $data['studentIds'];

    $sent = 0;
    $errors = [];

    try {
      $mailManager = \Drupal::service('plugin.manager.mail');
      $langcode = \Drupal::languageManager()->getDefaultLanguage()->getId();

      foreach ($student_ids as $student_id) {
        $student = Node::load($student_id);

        if ($student && $student->bundle() === 'student') {
          $parent_email = $student->get('field_parent_email')->value;
          $student_name = $student->get('field_first_name')->value . ' ' . $student->get('field_last_name')->value;

          // Formatear fecha en español
          $date_obj = new \DateTime($date);
          $formatted_date = $date_obj->format('d/m/Y');

          // Preparar el mensaje
          $to = $parent_email;
          $subject = 'Notificación de Ausencia - ' . $formatted_date;

          $body = "Estimado padre/madre:\n\n";
          $body .= "Le informamos que su hijo/a {$student_name} ha registrado una ausencia el día {$formatted_date}.\n\n";
          $body .= "Por favor, justifique la inasistencia a la brevedad.\n\n";
          $body .= "Saludos cordiales,\n";
          $body .= "Equipo de Preceptoría";

          $params = [
            'subject' => $subject,
            'body' => $body,
          ];

          // Enviar email usando el sistema de Drupal
          $result = $mailManager->mail(
            'school_system',
            'absence_notification',
            $to,
            $langcode,
            $params,
            NULL,
            TRUE
          );

          if ($result['result']) {
            $sent++;
          }
          else {
            $errors[] = "Failed to send email to $parent_email";
          }
        }
      }

      return new JsonResponse([
        'success' => TRUE,
        'sent' => $sent,
        'message' => "$sent emails enviados",
        'errors' => $errors,
      ]);
    }
    catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 500);
    }
  }

}
