<?php

namespace TuranFurkan\CoreCms\Domains\Integration\Actions;

use TuranFurkan\CoreCms\Domains\Integration\Models\Webhook;

class DeleteWebhookAction
{
    public function execute(Webhook $webhook): void
    {
        $webhook->delete();
    }
}
