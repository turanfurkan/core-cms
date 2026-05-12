<?php

namespace App\Domains\User\Listeners;

use App\Domains\User\Events\OtpRequested;
use App\Domains\User\Models\User;

class LogOtpRequested
{
    public function handle(OtpRequested $event): void
    {
        $logger = activity('user.otp')
            ->withProperties([
                'phone_masked' => $event->phoneMasked,
                'channel' => $event->channel,
                'purpose' => $event->purpose,
                'status' => $event->status,
                'ip' => $event->ip,
                'user_agent' => $event->userAgent,
                'request_id' => $event->requestId,
                'user_id' => $event->userId,
            ]);

        if ($event->userId !== null) {
            $causer = User::query()->find($event->userId);
            if ($causer !== null) {
                $logger->causedBy($causer)->performedOn($causer);
            }
        }

        $logger->log('user.otp.requested');
    }
}
