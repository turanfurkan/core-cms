<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Listeners;

use TuranFurkan\CoreCms\Domains\Identity\Events\OtpVerified;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;

class LogOtpVerified
{
    public function handle(OtpVerified $event): void
    {
        $user = User::query()->find($event->userId);

        $logger = activity('user.otp')
            ->withProperties([
                'phone_masked' => $event->phoneMasked,
                'ip' => $event->ip,
                'user_agent' => $event->userAgent,
                'request_id' => $event->requestId,
                'user_id' => $event->userId,
            ]);

        if ($user !== null) {
            $logger->causedBy($user)->performedOn($user);
        }

        $logger->log('user.otp.verified');
    }
}
