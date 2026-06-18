<?php

namespace App\Domains\Identity\Sms;

use App\Domains\Identity\Contracts\SmsGateway;
use App\Domains\Identity\Exceptions\SmsDeliveryException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioSmsGateway implements SmsGateway
{
    public function __construct(
        protected ?string $sid,
        protected ?string $authToken,
        protected ?string $from
    ) {}

    public function name(): string
    {
        return 'twilio';
    }

    public function send(string $phone, string $message): void
    {
        if (empty($this->sid) || empty($this->authToken) || empty($this->from)) {
            throw new SmsDeliveryException(
                provider: $this->name(),
                message: 'Twilio credentials are not configured.',
                errorCode: 'twilio.config_missing'
            );
        }

        $url = "https://api.twilio.com/2010-04-01/Accounts/{$this->sid}/Messages.json";

        $response = Http::withBasicAuth($this->sid, $this->authToken)
            ->asForm()
            ->post($url, [
                'From' => $this->from,
                'To' => $phone,
                'Body' => $message,
            ]);

        if ($response->failed()) {
            $errorData = $response->json();
            $errorMessage = $errorData['message'] ?? 'Twilio API call failed';
            $twilioErrorCode = $errorData['code'] ?? $response->status();

            Log::error('Twilio SMS delivery failed.', [
                'phone' => $phone,
                'error' => $errorMessage,
                'code' => $twilioErrorCode,
            ]);

            throw new SmsDeliveryException(
                provider: $this->name(),
                message: $errorMessage,
                errorCode: 'twilio.provider_error.' . $twilioErrorCode
            );
        }
    }
}
