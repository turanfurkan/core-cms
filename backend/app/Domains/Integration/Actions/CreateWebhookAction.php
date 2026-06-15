<?php

namespace App\Domains\Integration\Actions;

use App\Domains\Integration\DTOs\WebhookData;
use App\Domains\Integration\Models\Webhook;

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
