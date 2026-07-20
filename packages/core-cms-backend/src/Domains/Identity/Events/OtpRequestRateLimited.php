<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OtpRequestRateLimited
{
    use Dispatchable, SerializesModels;

    public const REASON_RATE_LIMIT = 'rate_limit';
    public const REASON_COOLDOWN = 'cooldown';

    public function __construct(
        public string $phoneMasked,
        public ?string $ip,
        public int $retryAfter,
        public string $reason = self::REASON_RATE_LIMIT,
    ) {
    }
}
