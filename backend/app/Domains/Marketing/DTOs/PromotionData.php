<?php

namespace App\Domains\Marketing\DTOs;

use Illuminate\Http\Request;

class PromotionData
{
    public function __construct(
        public readonly string $name,
        public readonly string $type,
        public readonly array $content,
        public readonly ?array $rules = null,
        public readonly bool $isActive = true
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->input('name'),
            type: $request->input('type'),
            content: $request->input('content', []),
            rules: $request->input('rules'),
            isActive: (bool) $request->input('is_active', true)
        );
    }
}
