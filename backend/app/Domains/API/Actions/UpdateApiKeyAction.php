<?php

namespace App\Domains\API\Actions;

use App\Domains\API\DTOs\ApiKeyData;
use App\Domains\API\Models\ApiKey;

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
