<?php

namespace App\Domains\User\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OtpDeliveryFailed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $phoneMasked,
        public string $provider,
        public ?string $errorCode = null,
        public ?string $requestId = null,
    ) {
    }
}
