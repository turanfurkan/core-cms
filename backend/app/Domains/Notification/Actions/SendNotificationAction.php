<?php

namespace App\Domains\Notification\Actions;

use App\Domains\Notification\Support\DynamicNotification;

class SendNotificationAction
{
    public function execute($notifiable, string $templateCode, array $variables = []): void
    {
        $notifiable->notify(new DynamicNotification($templateCode, $variables));
    }
}
