<?php

namespace App\Domains\Content\DTOs;

class ContentTypeData
{
    public function __construct(
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description = null,
        public readonly bool $is_collection = true
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            slug: $data['slug'],
            description: $data['description'] ?? null,
            is_collection: (bool) ($data['is_collection'] ?? true)
        );
    }
}
