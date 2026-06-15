<?php

namespace App\Domains\Integration\Actions;

use App\Domains\Integration\DTOs\WebhookData;
use App\Domains\Integration\Models\Webhook;

class UpdateWebhookAction
{
    public function execute(Webhook $webhook, WebhookData $dto): Webhook
    {
        $webhook->update([
            'name' => $dto->name,
            'url' => $dto->url,
            'events' => $dto->events,
            'secret' => $dto->secret,
            'headers' => $dto->headers,
            'is_active' => $dto->isActive,
        ]);

        return $webhook->fresh();
    }
}
