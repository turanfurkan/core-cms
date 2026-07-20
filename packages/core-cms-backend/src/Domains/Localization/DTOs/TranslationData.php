<?php

namespace TuranFurkan\CoreCms\Domains\Localization\DTOs;

use Illuminate\Http\Request;

final class TranslationData
{
    public function __construct(
        public readonly string $group,
        public readonly string $key,
        public readonly array $text,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            group: (string) $request->input('group', 'messages'),
            key: (string) $request->input('key'),
            text: (array) $request->input('text'),
        );
    }

    public static function fromArray(array $payload): self
    {
        return new self(
            group: (string) ($payload['group'] ?? 'messages'),
            key: (string) ($payload['key'] ?? ''),
            text: (array) ($payload['text'] ?? []),
        );
    }
}
