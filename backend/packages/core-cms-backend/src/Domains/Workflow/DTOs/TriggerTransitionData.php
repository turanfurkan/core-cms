<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\DTOs;

use Illuminate\Http\Request;

final class TriggerTransitionData
{
    public function __construct(
        public readonly int $transitionId,
        public readonly ?string $comment = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            transitionId: (int) $request->input('transition_id'),
            comment: $request->input('comment') ? (string) $request->input('comment') : null,
        );
    }

    public static function fromArray(array $payload): self
    {
        return new self(
            transitionId: (int) ($payload['transition_id'] ?? 0),
            comment: $payload['comment'] ?? null,
        );
    }
}
