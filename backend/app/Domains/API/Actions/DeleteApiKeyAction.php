<?php

namespace App\Domains\API\Actions;

use App\Domains\API\Models\ApiKey;

class DeleteApiKeyAction
{
    public function execute(ApiKey $apiKey): void
    {
        $apiKey->delete();
    }
}
