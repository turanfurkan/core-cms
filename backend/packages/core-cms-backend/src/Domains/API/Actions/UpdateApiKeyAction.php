<?php

namespace TuranFurkan\CoreCms\Domains\API\Actions;

use TuranFurkan\CoreCms\Domains\API\DTOs\ApiKeyData;
use TuranFurkan\CoreCms\Domains\API\Models\ApiKey;

class UpdateApiKeyAction
{
    public function execute(ApiKey $apiKey, ApiKeyData $dto): ApiKey
    {
        $apiKey->update([
            'name' => $dto->name,
            'scopes' => $dto->scopes,
            'expires_at' => $dto->expiresAt,
            'is_active' => $dto->isActive,
        ]);

        return $apiKey->fresh();
    }
}
