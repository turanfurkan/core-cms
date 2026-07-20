<?php

namespace TuranFurkan\CoreCms\Domains\Integration\Actions;

use TuranFurkan\CoreCms\Domains\Integration\DTOs\WebhookData;
use TuranFurkan\CoreCms\Domains\Integration\Models\Webhook;

class CreateWebhookAction
{
    public function execute(WebhookData $dto): Webhook
    {
        return Webhook::create([
            'name' => $dto->name,
            'url' => $dto->url,
            'events' => $dto->events,
            'secret' => $dto->secret,
            'headers' => $dto->headers,
            'is_active' => $dto->isActive,
        ]);
    }
}
