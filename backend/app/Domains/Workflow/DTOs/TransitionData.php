<?php

namespace App\Domains\Workflow\DTOs;

final class TransitionData
{
    public function __construct(
        public readonly string $name,
        public readonly string $fromStateCode,
        public readonly string $toStateCode,
        public readonly ?string $requiredRole = null,
    ) {}

    public static function fromArray(array $payload): self
    {
        return new self(
            name: (string) ($payload['name'] ?? ''),
            fromStateCode: (string) ($payload['from_state_code'] ?? ''),
            toStateCode: (string) ($payload['to_state_code'] ?? ''),
            requiredRole: $payload['required_role'] ?? null,
        );
    }
}
