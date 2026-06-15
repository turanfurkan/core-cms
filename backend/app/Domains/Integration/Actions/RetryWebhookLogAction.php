<?php

namespace App\Domains\Integration\Actions;

use App\Domains\Integration\Models\Webhook;
use App\Domains\Integration\Models\WebhookLog;
use App\Domains\Integration\Jobs\DispatchWebhookJob;

class RetryWebhookLogAction
{
    public function execute(Webhook $webhook, WebhookLog $log): void
    {
        if ((int) $log->webhook_id !== (int) $webhook->id) {
            throw new \InvalidArgumentException("Log record does not belong to the specified webhook.");
        }

        dispatch(new DispatchWebhookJob($webhook, $log->event, $log->payload));
    }
}
