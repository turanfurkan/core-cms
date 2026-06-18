<?php

namespace App\Domains\API\Actions;

use App\Domains\API\DTOs\ApiKeyData;
use App\Domains\API\Models\ApiKey;

class CreateApiKeyAction
{
    public function execute(ApiKeyData $dto): ApiKey
    {
        $randomPart = bin2hex(random_bytes(20)); // 40 chars hex
        $rawKey = 'corecms_key_' . $randomPart;
        $hashedKey = hash('sha256', $rawKey);
        $hint = 'corecms_key_...' . substr($rawKey, -4);

        $apiKey = ApiKey::create([
            'name' => $dto->name,
            'hashed_key' => $hashedKey,
            'hint' => $hint,
            'scopes' => $dto->scopes,
            'expires_at' => $dto->expiresAt,
            'is_active' => $dto->isActive,
        ]);

        $apiKey->raw_key = $rawKey;

        return $apiKey;
    }
}
