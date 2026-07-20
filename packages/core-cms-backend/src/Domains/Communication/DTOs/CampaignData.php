<?php

namespace TuranFurkan\CoreCms\Domains\Communication\DTOs;

use Illuminate\Http\Request;

class CampaignData
{
    public function __construct(
        public readonly string $name,
        public readonly string $templateCode,
        public readonly ?string $scheduledAt = null
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->input('name'),
            templateCode: $request->input('template_code'),
            scheduledAt: $request->input('scheduled_at')
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            templateCode: $data['template_code'],
            scheduledAt: $data['scheduled_at'] ?? null
        );
    }
}
