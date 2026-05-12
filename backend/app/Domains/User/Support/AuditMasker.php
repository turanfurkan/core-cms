<?php

namespace App\Domains\User\Support;

class AuditMasker
{
    public static function maskPhone(?string $phone): ?string
    {
        if ($phone === null || $phone === '') {
            return null;
        }

        $length = strlen($phone);

        if ($length <= 4) {
            return str_repeat('*', $length);
        }

        return substr($phone, 0, 3)
            . str_repeat('*', max(0, $length - 7))
            . substr($phone, -4);
    }

    public static function maskEmail(?string $email): ?string
    {
        if ($email === null || $email === '') {
            return null;
        }

        if (! str_contains($email, '@')) {
            return $email;
        }

        [$local, $domain] = explode('@', $email, 2);

        $maskedLocal = strlen($local) > 1
            ? substr($local, 0, 1) . str_repeat('*', max(0, strlen($local) - 1))
            : '*';

        return $maskedLocal . '@' . $domain;
    }

    /**
     * Auto-detect identifier type and mask accordingly.
     */
    public static function maskIdentifier(?string $identifier): ?string
    {
        if ($identifier === null || $identifier === '') {
            return null;
        }

        if (str_contains($identifier, '@')) {
            return self::maskEmail($identifier);
        }

        return self::maskPhone($identifier);
    }
}
