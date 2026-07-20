<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OtpRequested
{
    use Dispatchable, SerializesModels;

    public const STATUS_SENT = 'sent';
    public const STATUS_FAILED = 'failed';

    public function __construct(
        public string $phoneMasked,
        public string $channel = 'sms',
        public ?string $ip = null,
        public ?string $userAgent = null,
        public ?string $requestId = null,
        public string $status = self::STATUS_SENT,
        public ?int $userId = null,
        public string $purpose = 'login',
    ) {
    }
}
