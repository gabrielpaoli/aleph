<?php

namespace Drupal\whatsapp_notifier\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Drupal\whatsapp_notifier\Service\WhatsappService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * REST-style API controller for WhatsApp notifications.
 */
class WhatsappApiController extends ControllerBase {

  /**
   * @var \Drupal\whatsapp_notifier\Service\WhatsappService
   */
  protected $whatsappService;

  /**
   * Constructor.
   */
  public function __construct(WhatsappService $whatsappService) {
    $this->whatsappService = $whatsappService;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('whatsapp_notifier.whatsapp_service')
    );
  }

  // ---------------------------------------------------------------------------
  // GET /api/whatsapp/status
  // ---------------------------------------------------------------------------

  /**
   * Returns whether WhatsApp is configured and enabled for this school/site.
   */
  public function status(): JsonResponse {
    return new JsonResponse($this->whatsappService->getStatus());
  }

  // ---------------------------------------------------------------------------
  // POST /api/whatsapp/send-absence
  // ---------------------------------------------------------------------------

  /**
   * Send absence WhatsApp notifications to parents.
   *
   * Expected JSON body:
   * {
   *   "date":       "2026-02-18",
   *   "studentIds": [123, 456]
   * }
   */
  public function sendAbsenceMessages(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);

    if (empty($data['date']) || empty($data['studentIds'])) {
      return new JsonResponse(['error' => 'Se requieren los campos "date" y "studentIds".'], 400);
    }

    if (!$this->whatsappService->isEnabled()) {
      return new JsonResponse(['error' => 'WhatsApp Notifier no está configurado o habilitado para esta escuela.'], 503);
    }

    $date       = $data['date'];
    $studentIds = $data['studentIds'];
    $schoolName = $this->whatsappService->getSchoolName();

    // Format date in Spanish.
    try {
      $dateObj       = new \DateTime($date);
      $formattedDate = $dateObj->format('d/m/Y');
    }
    catch (\Exception $e) {
      $formattedDate = $date;
    }

    $phones = [];
    $skipped = [];

    foreach ($studentIds as $studentId) {
      $node = Node::load($studentId);

      if (!$node || $node->bundle() !== 'student') {
        $skipped[] = "ID $studentId no encontrado";
        continue;
      }

      $phone = $node->get('field_parent_phone')->value ?? '';

      if (empty($phone)) {
        $name = $node->get('field_first_name')->value . ' ' . $node->get('field_last_name')->value;
        $skipped[] = "Sin teléfono: $name";
        continue;
      }

      $phones[] = $phone;
    }

    if (empty($phones)) {
      return new JsonResponse([
        'success' => FALSE,
        'sent'    => 0,
        'skipped' => $skipped,
        'message' => 'Ningún estudiante tiene teléfono de padre registrado.',
      ], 200);
    }

    $body  = "📚 *$schoolName*\n\n";
    $body .= "Estimado padre/madre,\n\n";
    $body .= "Le informamos que su hijo/a *registró una ausencia* el día *$formattedDate*.\n\n";
    $body .= "Por favor, justifique la inasistencia a la brevedad.\n\n";
    $body .= "_Equipo de Preceptoría_";

    $result = $this->whatsappService->sendBulk($phones, $body);

    return new JsonResponse([
      'success' => TRUE,
      'sent'    => $result['sent'],
      'failed'  => $result['failed'],
      'skipped' => $skipped,
      'errors'  => $result['errors'],
      'message' => "{$result['sent']} mensajes WhatsApp enviados.",
    ]);
  }

  // ---------------------------------------------------------------------------
  // POST /api/whatsapp/send-note
  // ---------------------------------------------------------------------------

  /**
   * Send a note (comunicado) to parent(s) via WhatsApp.
   *
   * Expected JSON body – one of:
   *   { "title": "...", "content": "...", "studentId": 123 }
   *   { "title": "...", "content": "...", "courseId":  456 }
   */
  public function sendNoteMessages(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);

    if (empty($data['title']) || empty($data['content'])) {
      return new JsonResponse(['error' => 'Se requieren los campos "title" y "content".'], 400);
    }

    if (!$this->whatsappService->isEnabled()) {
      return new JsonResponse(['error' => 'WhatsApp Notifier no está configurado o habilitado para esta escuela.'], 503);
    }

    $title      = $data['title'];
    $content    = $data['content'];
    $schoolName = $this->whatsappService->getSchoolName();

    $phones  = [];
    $skipped = [];

    // --- Individual student ---
    if (!empty($data['studentId'])) {
      $node = Node::load($data['studentId']);
      if ($node && $node->bundle() === 'student') {
        $phone = $node->get('field_parent_phone')->value ?? '';
        if ($phone) {
          $phones[] = $phone;
        }
        else {
          $name = $node->get('field_first_name')->value . ' ' . $node->get('field_last_name')->value;
          $skipped[] = "Sin teléfono: $name";
        }
      }
    }

    // --- Full course ---
    elseif (!empty($data['courseId'])) {
      $query = \Drupal::entityQuery('node')
        ->condition('type', 'student')
        ->condition('field_course_ref', $data['courseId'])
        ->condition('status', 1)
        ->accessCheck(FALSE);

      foreach ($query->execute() as $nid) {
        $node  = Node::load($nid);
        $phone = $node?->get('field_parent_phone')->value ?? '';
        if ($phone) {
          $phones[] = $phone;
        }
        else {
          $name = ($node?->get('field_first_name')->value ?? '') . ' ' . ($node?->get('field_last_name')->value ?? '');
          $skipped[] = "Sin teléfono: " . trim($name);
        }
      }
    }
    else {
      return new JsonResponse(['error' => 'Debe indicar "studentId" o "courseId".'], 400);
    }

    if (empty($phones)) {
      return new JsonResponse([
        'success' => FALSE,
        'sent'    => 0,
        'skipped' => $skipped,
        'message' => 'Ningún estudiante tiene teléfono de padre registrado.',
      ], 200);
    }

    $body  = "📚 *$schoolName*\n\n";
    $body .= "📢 *$title*\n\n";
    $body .= "$content\n\n";
    $body .= "_Comunicado enviado por la institución_";

    $result = $this->whatsappService->sendBulk($phones, $body);

    return new JsonResponse([
      'success' => TRUE,
      'sent'    => $result['sent'],
      'failed'  => $result['failed'],
      'skipped' => $skipped,
      'errors'  => $result['errors'],
      'message' => "{$result['sent']} mensajes WhatsApp enviados.",
    ]);
  }

}
