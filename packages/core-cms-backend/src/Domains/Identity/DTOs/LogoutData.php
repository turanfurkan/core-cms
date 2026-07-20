<?php

namespace TuranFurkan\CoreCms\Domains\Identity\DTOs;

final class LogoutData
{
    public function __construct(
        public readonly string $scope,
        public readonly ?int $targetUserId = null,
        public readonly ?string $reason = null,
        public readonly ?string $currentAccessTokenId = null,
    ) {
    }

    public static function fromRequest($request): self
    {
        return new self(
            scope: (string) $request->input('scope'),
            targetUserId: $request->input('target_user_id') ? (int) $request->input('target_user_id') : null,
            reason: $request->input('reason') ? (string) $request->input('reason') : null,
            currentAccessTokenId: (string) ($request->user()?->currentAccessToken()?->id ?? ''),
        );
    }
}
