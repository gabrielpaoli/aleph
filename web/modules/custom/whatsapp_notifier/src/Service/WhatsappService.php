<?php

namespace Drupal\whatsapp_notifier\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\RequestException;

/**
 * Service for sending WhatsApp messages via Twilio REST API.
 *
 * Uses GuzzleHttp (already present in vendor) instead of the Twilio PHP SDK
 * so no extra composer dependency is needed.
 */
class WhatsappService {

  /**
   * Twilio Messages API endpoint template.
   */
  const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json';

  /**
   * @var \Drupal\Core\Config\ImmutableConfig
   */
  protected $config;

  /**
   * @var \Psr\Log\LoggerInterface
   */
  protected $logger;

  /**
   * @var \GuzzleHttp\ClientInterface
   */
  protected $httpClient;

  /**
   * Constructor.
   */
  public function __construct(
    ConfigFactoryInterface $configFactory,
    LoggerChannelFactoryInterface $loggerFactory,
    ClientInterface $httpClient
  ) {
    $this->config = $configFactory->get('whatsapp_notifier.settings');
    $this->logger = $loggerFactory->get('whatsapp_notifier');
    $this->httpClient = $httpClient;
  }

  /**
   * Returns TRUE if the module is configured and enabled.
   */
  public function isEnabled(): bool {
    return (bool) $this->config->get('enabled')
      && !empty($this->config->get('account_sid'))
      && !empty($this->config->get('auth_token'))
      && !empty($this->config->get('from_number'));
  }

  /**
   * Returns a status array suitable for the /api/whatsapp/status endpoint.
   */
  public function getStatus(): array {
    return [
      'enabled' => $this->isEnabled(),
      'school_name' => $this->config->get('school_name') ?? '',
      'from_number_configured' => !empty($this->config->get('from_number')),
    ];
  }

  /**
   * Send a single WhatsApp message to a phone number.
   *
   * @param string $to
   *   Phone number in E.164 format, e.g. +5491112345678.
   *   The "whatsapp:" prefix will be added automatically if missing.
   * @param string $body
   *   Message body.
   *
   * @return array
   *   ['success' => bool, 'sid' => string|null, 'error' => string|null]
   */
  public function sendMessage(string $to, string $body): array {
    if (!$this->isEnabled()) {
      return ['success' => FALSE, 'error' => 'WhatsApp Notifier is not configured or disabled.'];
    }

    $accountSid = $this->config->get('account_sid');
    $authToken  = $this->config->get('auth_token');
    $from       = trim((string) $this->config->get('from_number'));

    // Ensure "whatsapp:" prefix on destination number.
    if (!str_starts_with($to, 'whatsapp:')) {
      $to = 'whatsapp:' . $to;
    }

    // Ensure "whatsapp:" prefix on configured from number too (user may
    // have entered a bare +123... number). Twilio requires both From and To
    // to be the same channel (WhatsApp). We add the prefix here to be tolerant
    // and avoid common misconfiguration.
    if (!str_starts_with($from, 'whatsapp:')) {
      $from = 'whatsapp:' . $from;
    }

    $url = sprintf(self::TWILIO_API_URL, $accountSid);

    try {
      $response = $this->httpClient->request('POST', $url, [
        'auth' => [$accountSid, $authToken],
        'form_params' => [
          'From' => $from,
          'To'   => $to,
          'Body' => $body,
        ],
      ]);

      $data = json_decode((string) $response->getBody(), TRUE);
      $this->logger->info('WhatsApp sent to @to. SID: @sid', [
        '@to'  => $to,
        '@sid' => $data['sid'] ?? 'unknown',
      ]);

      return ['success' => TRUE, 'sid' => $data['sid'] ?? NULL];
    }
    catch (RequestException $e) {
      $errorBody = $e->hasResponse()
        ? (string) $e->getResponse()->getBody()
        : $e->getMessage();

      // Try to parse Twilio JSON error to provide a clearer hint for
      // the common 21910 Invalid From/To pair error.
      $userFriendly = $errorBody;
      if ($e->hasResponse()) {
        $resp = (string) $e->getResponse()->getBody();
        $json = json_decode($resp, TRUE);
        if (is_array($json) && isset($json['code']) && $json['code'] == 21910) {
          $userFriendly = sprintf(
            "Twilio error 21910 (Invalid From/To pair): %s. Ensure the 'From' value is a WhatsApp-enabled Twilio number and both 'From' and 'To' are WhatsApp channels (e.g. 'whatsapp:+1415...').",
            $json['message'] ?? $resp
          );
        }
      }

      $this->logger->error('Failed to send WhatsApp to @to from @from: @error', [
        '@to'    => $to,
        '@from'  => $from,
        '@error' => $errorBody,
      ]);

      return ['success' => FALSE, 'error' => $userFriendly];
    }
  }

  /**
   * Send the same message to multiple phone numbers.
   *
   * @param string[] $phones
   *   Array of phone numbers in E.164 format.
   * @param string $body
   *   Message body.
   *
   * @return array
   *   Summary: ['sent' => int, 'failed' => int, 'errors' => string[]]
   */
  public function sendBulk(array $phones, string $body): array {
    $sent   = 0;
    $failed = 0;
    $errors = [];

    foreach ($phones as $phone) {
      if (empty($phone)) {
        continue;
      }
      $result = $this->sendMessage($phone, $body);
      if ($result['success']) {
        $sent++;
      }
      else {
        $failed++;
        $errors[] = "[$phone]: " . ($result['error'] ?? 'unknown error');
      }
    }

    return ['sent' => $sent, 'failed' => $failed, 'errors' => $errors];
  }

  /**
   * Returns the configured school name or a default.
   */
  public function getSchoolName(): string {
    return $this->config->get('school_name') ?: 'La Escuela';
  }

}
