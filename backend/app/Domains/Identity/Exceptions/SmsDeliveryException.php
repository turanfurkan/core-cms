<?php

namespace App\Domains\Identity\Exceptions;

use RuntimeException;
use Throwable;

class SmsDeliveryException extends RuntimeException
{
    public function __construct(
        public readonly string $provider,
        string $message = 'SMS delivery failed.',
        public readonly ?string $errorCode = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
