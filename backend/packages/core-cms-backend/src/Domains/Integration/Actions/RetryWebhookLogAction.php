<?php

namespace TuranFurkan\CoreCms\Domains\Integration\Actions;

use TuranFurkan\CoreCms\Domains\Integration\Models\Webhook;
use TuranFurkan\CoreCms\Domains\Integration\Models\WebhookLog;
use TuranFurkan\CoreCms\Domains\Integration\Jobs\DispatchWebhookJob;

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
