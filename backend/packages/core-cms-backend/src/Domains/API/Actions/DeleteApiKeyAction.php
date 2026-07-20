<?php

namespace TuranFurkan\CoreCms\Domains\API\Actions;

use TuranFurkan\CoreCms\Domains\API\Models\ApiKey;

class DeleteApiKeyAction
{
    public function execute(ApiKey $apiKey): void
    {
        $apiKey->delete();
    }
}
