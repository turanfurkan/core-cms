<?php

namespace App\Domains\User\Sms;

use App\Domains\User\Contracts\SmsGateway;
use App\Domains\User\Support\AuditMasker;
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
