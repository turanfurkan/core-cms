<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OtpVerified
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $phoneMasked,
        public int $userId,
        public ?string $ip = null,
        public ?string $userAgent = null,
        public ?string $requestId = null,
    ) {
    }
}
