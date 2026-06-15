<?php

namespace App\Domains\Localization\DTOs;

use Illuminate\Http\Request;

final class LanguageData
{
    public function __construct(
        public readonly string $name,
        public readonly string $code,
        public readonly bool $isDefault = false,
        public readonly bool $isActive = true,
        public readonly string $direction = 'ltr',
        public readonly int $order = 0,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: (string) $request->input('name'),
            code: (string) $request->input('code'),
            isDefault: $request->has('is_default') ? (bool) $request->input('is_default') : false,
            isActive: $request->has('is_active') ? (bool) $request->input('is_active') : true,
            direction: (string) $request->input('direction', 'ltr'),
            order: (int) $request->input('order', 0),
        );
    }

    public static function fromArray(array $payload): self
    {
        return new self(
            name: (string) ($payload['name'] ?? ''),
            code: (string) ($payload['code'] ?? ''),
            isDefault: (bool) ($payload['is_default'] ?? false),
            isActive: (bool) ($payload['is_active'] ?? true),
            direction: (string) ($payload['direction'] ?? 'ltr'),
            order: (int) ($payload['order'] ?? 0),
        );
    }
}
