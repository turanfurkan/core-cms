<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class StrongPassword implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $password = (string) $value;

        $isValid = strlen($password) >= 8
            && preg_match('/[A-Z]/', $password)
            && preg_match('/[a-z]/', $password)
            && preg_match('/[0-9]/', $password);

        if (! $isValid) {
            $fail('The :attribute must be at least 8 characters and include upper, lower, and numeric characters.');
        }
    }
}
