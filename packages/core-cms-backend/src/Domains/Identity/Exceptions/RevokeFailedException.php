<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Exceptions;

use RuntimeException;

class RevokeFailedException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $statusCode = 400,
    ) {
        parent::__construct($message);
    }

    public static function forbidden(): self
    {
        return new self(
            errorCode: 'AUTH.FORBIDDEN',
            message: 'Bu kullanıcının oturumlarını sonlandırma yetkiniz yok (Hiyerarşi engeli).',
            statusCode: 403,
        );
    }

    public static function sessionNotFound(): self
    {
        return new self(
            errorCode: 'AUTH.SESSION_NOT_FOUND',
            message: 'Aktif oturum bulunamadı veya zaten sonlandırılmış.',
            statusCode: 404,
        );
    }
}
