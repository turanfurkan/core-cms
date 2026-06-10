<?php

namespace App\Domains\Identity\DTOs;

final class SendOtpResult
{
    public function __construct(
        public readonly int $retryAfter,
        public readonly string $requestId,
    ) {
    }
}
