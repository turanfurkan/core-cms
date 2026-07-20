<?php

namespace TuranFurkan\CoreCms\Domains\Notification\Actions;

use TuranFurkan\CoreCms\Domains\Notification\Support\DynamicNotification;

class SendNotificationAction
{
    public function execute($notifiable, string $templateCode, array $variables = []): void
    {
        $notifiable->notify(new DynamicNotification($templateCode, $variables));
    }
}
