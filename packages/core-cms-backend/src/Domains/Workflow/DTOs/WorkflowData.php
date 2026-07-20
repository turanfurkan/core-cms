<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\DTOs;

use Illuminate\Http\Request;

final class WorkflowData
{
    public function __construct(
        public readonly string $name,
        public readonly string $code,
        public readonly ?string $description = null,
        public readonly bool $isActive = true,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: (string) $request->input('name'),
            code: (string) $request->input('code'),
            description: $request->input('description') ? (string) $request->input('description') : null,
            isActive: $request->has('is_active') ? (bool) $request->input('is_active') : true,
        );
    }

    public static function fromArray(array $payload): self
    {
        return new self(
            name: (string) ($payload['name'] ?? ''),
            code: (string) ($payload['code'] ?? ''),
            description: $payload['description'] ?? null,
            isActive: $payload['is_active'] ?? true,
        );
    }
}
