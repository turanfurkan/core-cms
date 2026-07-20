<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Exceptions;

use RuntimeException;

class LoginException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $statusCode = 401,
        public readonly array $errors = [],
        public readonly ?int $retryAfter = null,
    ) {
        parent::__construct($message);
    }

    public static function invalidCredentials(): self
    {
        return new self(
            errorCode: 'AUTH.INVALID_CREDENTIALS',
            message: 'Kimlik bilgileri doğrulanamadı.',
            statusCode: 401,
        );
    }

    public static function tooManyAttempts(int $retryAfter): self
    {
        return new self(
            errorCode: 'AUTH.TOO_MANY_ATTEMPTS',
            message: 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.',
            statusCode: 429,
            retryAfter: $retryAfter,
        );
    }

    public static function accountLocked(): self
    {
        return new self(
            errorCode: 'AUTH.ACCOUNT_LOCKED',
            message: 'Hesabınız erişime kapalı.',
            statusCode: 403,
        );
    }

    public static function passwordLoginDisabled(): self
    {
        return new self(
            errorCode: 'AUTH.PASSWORD_LOGIN_DISABLED',
            message: 'Bu hesap için parola ile giriş kapalı.',
            statusCode: 403,
        );
    }
}
