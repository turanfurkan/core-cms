<?php

namespace App\Domains\Media\DTOs;

use Illuminate\Http\Request;

final class MediaMetaData
{
    public function __construct(
        public readonly ?string $altText = null,
        public readonly ?string $title = null,
        public readonly ?string $description = null,
        public readonly ?string $caption = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            altText: $request->input('alt_text') ? (string) $request->input('alt_text') : null,
            title: $request->input('title') ? (string) $request->input('title') : null,
            description: $request->input('description') ? (string) $request->input('description') : null,
            caption: $request->input('caption') ? (string) $request->input('caption') : null,
        );
    }

    public static function fromArray(array $payload): self
    {
        return new self(
            altText: $payload['alt_text'] ?? null,
            title: $payload['title'] ?? null,
            description: $payload['description'] ?? null,
            caption: $payload['caption'] ?? null,
        );
    }
}
