<?php

namespace App\Domains\Content\DTOs;

class ContentEntryData
{
    public function __construct(
        public readonly array $data,
        public readonly string $status = 'draft',
        public readonly ?array $seo = null
    ) {}

    public static function fromArray(array $payload): self
    {
        return new self(
            data: $payload['data'] ?? [],
            status: $payload['status'] ?? 'draft',
            seo: $payload['seo'] ?? null
        );
    }
}
