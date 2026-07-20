<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Rules;

use TuranFurkan\CoreCms\Domains\Identity\Support\PhoneNumberNormalizer;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PhoneNumber implements ValidationRule
{
    public function __construct(private ?string $defaultRegion = null)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $normalizer = app(PhoneNumberNormalizer::class);

        if (! $normalizer->isValid((string) $value, $this->defaultRegion)) {
            $fail('The :attribute must be a valid phone number.');
        }
    }
}
