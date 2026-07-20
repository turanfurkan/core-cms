<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\DTOs;

final class StateData
{
    public function __construct(
        public readonly string $name,
        public readonly string $code,
        public readonly bool $isInitial = false,
        public readonly bool $isFinal = false,
    ) {}

    public static function fromArray(array $payload): self
    {
        return new self(
            name: (string) ($payload['name'] ?? ''),
            code: (string) ($payload['code'] ?? ''),
            isInitial: (bool) ($payload['is_initial'] ?? false),
            isFinal: (bool) ($payload['is_final'] ?? false),
        );
    }
}
