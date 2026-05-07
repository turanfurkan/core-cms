<?php

namespace App\Domains\User\Exceptions;

use RuntimeException;

class OtpException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $statusCode = 400,
        public readonly array $errors = [],
        public readonly ?int $retryAfter = null,
    ) {
        parent::__construct($message);
    }

    public static function rateLimited(int $retryAfter): self
    {
        return new self(
            errorCode: 'AUTH.OTP_RATE_LIMITED',
            message: 'Çok fazla OTP isteği. Daha sonra tekrar deneyin.',
            statusCode: 429,
            retryAfter: $retryAfter,
        );
    }

    public static function cooldownActive(int $retryAfter): self
    {
        return new self(
            errorCode: 'AUTH.OTP_COOLDOWN_ACTIVE',
            message: 'Yeni bir OTP istemek için biraz beklemelisiniz.',
            statusCode: 429,
            retryAfter: $retryAfter,
        );
    }

    public static function deliveryFailed(): self
    {
        return new self(
            errorCode: 'AUTH.OTP_DELIVERY_FAILED',
            message: 'OTP iletilemedi. Lütfen daha sonra tekrar deneyin.',
            statusCode: 502,
        );
    }

    public static function channelUnavailable(): self
    {
        return new self(
            errorCode: 'AUTH.OTP_CHANNEL_UNAVAILABLE',
            message: 'OTP gönderim kanalı şu anda kullanılamıyor.',
            statusCode: 503,
        );
    }
}
