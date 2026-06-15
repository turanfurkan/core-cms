<?php

namespace App\Domains\Integration\Actions;

use App\Domains\Integration\Models\Webhook;

class DeleteWebhookAction
{
    public function execute(Webhook $webhook): void
    {
        $webhook->delete();
    }
}
