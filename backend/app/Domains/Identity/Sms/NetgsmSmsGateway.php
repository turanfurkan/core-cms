<?php

namespace App\Domains\Identity\Sms;

use App\Domains\Identity\Contracts\SmsGateway;
use App\Domains\Identity\Exceptions\SmsDeliveryException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NetgsmSmsGateway implements SmsGateway
{
    public function __construct(
        protected ?string $usercode,
        protected ?string $password,
        protected ?string $header
    ) {}

    public function name(): string
    {
        return 'netgsm';
    }

    public function send(string $phone, string $message): void
    {
        if (empty($this->usercode) || empty($this->password)) {
            throw new SmsDeliveryException(
                provider: $this->name(),
                message: 'Netgsm credentials are not configured.',
                errorCode: 'netgsm.config_missing'
            );
        }

        // Clean phone number: Netgsm expects numbers without leading + or 00 for Turkey,
        // but can accept local format or international format. Let's strip "+" character.
        $cleanPhone = ltrim($phone, '+');

        $response = Http::asForm()->post('https://api.netgsm.com.tr/sms/send/get', [
            'usercode' => $this->usercode,
            'password' => $this->password,
            'gsmno' => $cleanPhone,
            'message' => $message,
            'msgheader' => $this->header ?? 'CoreCMS',
            'dil' => 'TR',
        ]);

        if ($response->failed()) {
            throw new SmsDeliveryException(
                provider: $this->name(),
                message: 'Netgsm server returned connection error: ' . $response->status(),
                errorCode: 'netgsm.http_error'
            );
        }

        $body = trim($response->body());

        // Netgsm returns "00 <id>" on success, e.g. "00 123456"
        if (!str_starts_with($body, '00')) {
            Log::error('Netgsm SMS delivery failed.', [
                'phone' => $phone,
                'response' => $body,
            ]);

            throw new SmsDeliveryException(
                provider: $this->name(),
                message: 'Netgsm failed with status: ' . $body,
                errorCode: 'netgsm.provider_error.' . strtok($body, ' ')
            );
        }
    }
}
