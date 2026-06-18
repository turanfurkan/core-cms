<?php

namespace App\Domains\Marketing\DTOs;

use Illuminate\Http\Request;

class WidgetData
{
    public function __construct(
        public readonly string $key,
        public readonly string $type,
        public readonly array $config,
        public readonly bool $isActive = true
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            key: $request->input('key'),
            type: $request->input('type'),
            config: $request->input('config', []),
            isActive: (bool) $request->input('is_active', true)
        );
    }
}
