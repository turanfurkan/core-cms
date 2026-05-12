<?php

namespace App\Domains\User\DataTransferObjects;

final class SendOtpResult
{
    public function __construct(
        public readonly int $retryAfter,
        public readonly string $requestId,
    ) {
    }
}
