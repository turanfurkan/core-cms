<?php

namespace App\Domains\Identity\Sms;

use App\Domains\Identity\Contracts\SmsGateway;
use App\Domains\Identity\Support\AuditMasker;
use Illuminate\Support\Facades\Log;

class LogSmsGateway implements SmsGateway
{
    public function name(): string
    {
        return 'log';
    }

    public function send(string $phone, string $message): void
    {
        Log::info('[OTP] SMS dispatched via log driver.', [
            'phone_masked' => AuditMasker::maskPhone($phone),
            'message_length' => mb_strlen($message),
        ]);
    }
}
