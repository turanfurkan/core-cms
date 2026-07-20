<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Support;

use InvalidArgumentException;

class OtpCodeGenerator
{
    public function __construct(private int $length = 6)
    {
        if ($this->length < 4 || $this->length > 10) {
            throw new InvalidArgumentException('OTP length must be between 4 and 10 digits.');
        }
    }

    public function generate(): string
    {
        $min = (int) (10 ** ($this->length - 1));
        $max = (int) (10 ** $this->length - 1);

        return (string) random_int($min, $max);
    }

    public function length(): int
    {
        return $this->length;
    }
}
