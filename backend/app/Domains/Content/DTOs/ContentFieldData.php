<?php

namespace App\Domains\Content\DTOs;

class ContentFieldData
{
    public function __construct(
        public readonly string $name,
        public readonly string $slug,
        public readonly string $type,
        public readonly ?array $validation_rules = null,
        public readonly ?array $options = null,
        public readonly int $order = 0
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            slug: $data['slug'],
            type: $data['type'],
            validation_rules: $data['validation_rules'] ?? null,
            options: $data['options'] ?? null,
            order: (int) ($data['order'] ?? 0)
        );
    }
}
