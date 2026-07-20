<?php

namespace TuranFurkan\CoreCms\Domains\Notification\DTOs;

use Illuminate\Http\Request;

final class NotificationTemplateData
{
    public function __construct(
        public readonly string $code,
        public readonly string $name,
        public readonly array $channels,
        public readonly ?string $subject = null,
        public readonly array $content = [],
        public readonly bool $isActive = true,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            code: (string) $request->input('code'),
            name: (string) $request->input('name'),
            channels: is_array($request->input('channels')) ? $request->input('channels') : [],
            subject: $request->filled('subject') ? (string) $request->input('subject') : null,
            content: is_array($request->input('content')) ? $request->input('content') : [],
            isActive: $request->has('is_active') ? (bool) $request->input('is_active') : true,
        );
    }

    public static function fromArray(array $payload): self
    {
        return new self(
            code: (string) ($payload['code'] ?? ''),
            name: (string) ($payload['name'] ?? ''),
            channels: is_array($payload['channels'] ?? null) ? $payload['channels'] : [],
            subject: $payload['subject'] ?? null,
            content: is_array($payload['content'] ?? null) ? $payload['content'] : [],
            isActive: (bool) ($payload['is_active'] ?? true),
        );
    }
}
