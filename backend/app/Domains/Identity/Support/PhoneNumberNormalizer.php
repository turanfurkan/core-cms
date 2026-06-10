<?php

namespace App\Domains\Identity\Support;

use libphonenumber\NumberParseException;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\PhoneNumberUtil;

class PhoneNumberNormalizer
{
    private PhoneNumberUtil $util;

    public function __construct()
    {
        $this->util = PhoneNumberUtil::getInstance();
    }

    /**
     * Normalize a phone number into E.164 format. Returns null if parsing or
     * validation fails so callers can decide how to handle invalid input.
     */
    public function normalize(string $phone, ?string $defaultRegion = null): ?string
    {
        $region = $defaultRegion ?? $this->defaultRegion();

        try {
            $parsed = $this->util->parse($phone, $region);
        } catch (NumberParseException) {
            return null;
        }

        if (! $this->util->isValidNumber($parsed)) {
            return null;
        }

        return $this->util->format($parsed, PhoneNumberFormat::E164);
    }

    public function isValid(string $phone, ?string $defaultRegion = null): bool
    {
        return $this->normalize($phone, $defaultRegion) !== null;
    }

    private function defaultRegion(): string
    {
        return (string) (config('user.phone.default_region') ?? 'TR');
    }
}
