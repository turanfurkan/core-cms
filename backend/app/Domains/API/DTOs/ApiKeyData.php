<?php

namespace App\Domains\API\DTOs;

use Illuminate\Http\Request;

final class ApiKeyData
{
    public function __construct(
        public readonly string $name,
        public readonly array $scopes,
        public readonly ?string $expiresAt = null,
        public readonly bool $isActive = true,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: (string) $request->input('name'),
            scopes: is_array($request->input('scopes')) ? $request->input('scopes') : [],
            expiresAt: $request->input('expires_at'),
            isActive: $request->has('is_active') ? (bool) $request->input('is_active') : true,
        );
    }
}
