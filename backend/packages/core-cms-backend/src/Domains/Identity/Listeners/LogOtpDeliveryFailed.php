<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Listeners;

use TuranFurkan\CoreCms\Domains\Identity\Events\OtpDeliveryFailed;

class LogOtpDeliveryFailed
{
    public function handle(OtpDeliveryFailed $event): void
    {
        activity('user.otp')
            ->withProperties([
                'phone_masked' => $event->phoneMasked,
                'provider' => $event->provider,
                'error_code' => $event->errorCode,
                'request_id' => $event->requestId,
            ])
            ->log('user.otp.delivery_failed');
    }
}
