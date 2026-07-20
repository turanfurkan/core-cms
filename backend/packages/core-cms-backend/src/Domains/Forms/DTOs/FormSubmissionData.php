<?php

namespace TuranFurkan\CoreCms\Domains\Forms\DTOs;

use Illuminate\Http\Request;

final class FormSubmissionData
{
    public function __construct(
        public readonly array $data,
        public readonly string $ipAddress,
        public readonly ?string $userAgent = null,
        public readonly string $status = 'unread',
    ) {}

    public static function fromRequest(Request $request): self
    {
        // Get all input except files (files are handled separately or converted to paths inside the Action)
        // Let's get the whole input array
        $inputData = $request->except(['_token', 'locale', 'hp_field']);

        return new self(
            data: $inputData,
            ipAddress: (string) $request->ip(),
            userAgent: (string) $request->userAgent(),
            status: 'unread',
        );
    }

    public static function fromArray(array $payload, string $ipAddress, ?string $userAgent = null): self
    {
        return new self(
            data: $payload['data'] ?? $payload,
            ipAddress: $ipAddress,
            userAgent: $userAgent,
            status: $payload['status'] ?? 'unread',
        );
    }
}
