<?php

namespace TuranFurkan\CoreCms\Domains\Integration\DTOs;

use Illuminate\Http\Request;

final class WebhookData
{
    public function __construct(
        public readonly string $name,
        public readonly string $url,
        public readonly array $events,
        public readonly ?string $secret = null,
        public readonly array $headers = [],
        public readonly bool $isActive = true,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: (string) $request->input('name'),
            url: (string) $request->input('url'),
            events: is_array($request->input('events')) ? $request->input('events') : [],
            secret: $request->filled('secret') ? (string) $request->input('secret') : null,
            headers: is_array($request->input('headers')) ? $request->input('headers') : [],
            isActive: $request->has('is_active') ? (bool) $request->input('is_active') : true,
        );
    }

    public static function fromArray(array $payload): self
    {
        return new self(
            name: (string) ($payload['name'] ?? ''),
            url: (string) ($payload['url'] ?? ''),
            events: is_array($payload['events'] ?? null) ? $payload['events'] : [],
            secret: $payload['secret'] ?? null,
            headers: is_array($payload['headers'] ?? null) ? $payload['headers'] : [],
            isActive: (bool) ($payload['is_active'] ?? true),
        );
    }
}
