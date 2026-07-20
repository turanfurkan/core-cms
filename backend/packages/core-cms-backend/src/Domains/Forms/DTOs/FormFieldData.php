<?php

namespace TuranFurkan\CoreCms\Domains\Forms\DTOs;

final class FormFieldData
{
    public function __construct(
        public readonly string $type,
        public readonly string $name,
        public readonly string $label,
        public readonly ?string $placeholder = null,
        public readonly bool $isRequired = false,
        public readonly array $validationRules = [],
        public readonly array $options = [],
        public readonly int $order = 0,
    ) {}

    public static function fromArray(array $payload): self
    {
        return new self(
            type: (string) ($payload['type'] ?? 'text'),
            name: (string) ($payload['name'] ?? ''),
            label: (string) ($payload['label'] ?? ''),
            placeholder: isset($payload['placeholder']) ? (string) $payload['placeholder'] : null,
            isRequired: (bool) ($payload['is_required'] ?? false),
            validationRules: is_array($payload['validation_rules'] ?? null) ? $payload['validation_rules'] : [],
            options: is_array($payload['options'] ?? null) ? $payload['options'] : [],
            order: (int) ($payload['order'] ?? 0),
        );
    }
}
