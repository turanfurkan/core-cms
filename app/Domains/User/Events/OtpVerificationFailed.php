<?php

namespace App\Domains\User\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OtpVerificationFailed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $phoneMasked,
        public string $reason,
        public ?string $ip = null,
        public ?string $userAgent = null,
        public ?string $requestId = null,
    ) {
    }
}
