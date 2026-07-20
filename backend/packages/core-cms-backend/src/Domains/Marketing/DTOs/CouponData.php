<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\DTOs;

use Illuminate\Http\Request;

class CouponData
{
    public function __construct(
        public readonly string $code,
        public readonly string $type,
        public readonly float $value,
        public readonly ?string $startsAt = null,
        public readonly ?string $expiresAt = null,
        public readonly ?int $usageLimit = null,
        public readonly bool $isActive = true
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            code: $request->input('code'),
            type: $request->input('type'),
            value: (float) $request->input('value'),
            startsAt: $request->input('starts_at'),
            expiresAt: $request->input('expires_at'),
            usageLimit: $request->input('usage_limit') ? (int) $request->input('usage_limit') : null,
            isActive: (bool) $request->input('is_active', true)
        );
    }
}
