<?php

namespace TuranFurkan\CoreCms\Domains\Media\DTOs;

use Illuminate\Http\Request;

final class FolderData
{
    public function __construct(
        public readonly string $name,
        public readonly ?int $parentId = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: (string) $request->input('name'),
            parentId: $request->input('parent_id') ? (int) $request->input('parent_id') : null,
        );
    }

    public static function fromArray(array $payload): self
    {
        return new self(
            name: (string) ($payload['name'] ?? ''),
            parentId: isset($payload['parent_id']) ? (int) $payload['parent_id'] : null,
        );
    }
}
