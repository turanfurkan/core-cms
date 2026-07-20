<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Rules;

use TuranFurkan\CoreCms\Domains\Identity\Support\PhoneNumberNormalizer;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class LoginIdentifier implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $raw = (string) $value;

        if (app(PhoneNumberNormalizer::class)->isValid($raw)) {
            return;
        }

        if (filter_var($raw, FILTER_VALIDATE_EMAIL) !== false) {
            return;
        }

        $fail('The :attribute must be a valid email or phone number.');
    }
}
