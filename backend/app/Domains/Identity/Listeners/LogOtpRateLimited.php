<?php

namespace App\Domains\Identity\Listeners;

use App\Domains\Identity\Events\OtpRequestRateLimited;

class LogOtpRateLimited
{
    public function handle(OtpRequestRateLimited $event): void
    {
        activity('user.otp')
            ->withProperties([
                'phone_masked' => $event->phoneMasked,
                'ip' => $event->ip,
                'retry_after' => $event->retryAfter,
                'reason' => $event->reason,
            ])
            ->log('user.otp.rate_limited');
    }
}
