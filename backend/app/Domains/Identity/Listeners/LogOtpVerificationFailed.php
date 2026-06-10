<?php

namespace App\Domains\Identity\Listeners;

use App\Domains\Identity\Events\OtpVerificationFailed;

class LogOtpVerificationFailed
{
    public function handle(OtpVerificationFailed $event): void
    {
        activity('user.otp')
            ->withProperties([
                'phone_masked' => $event->phoneMasked,
                'reason' => $event->reason,
                'ip' => $event->ip,
                'user_agent' => $event->userAgent,
                'request_id' => $event->requestId,
            ])
            ->log('user.otp.verification_failed');
    }
}
