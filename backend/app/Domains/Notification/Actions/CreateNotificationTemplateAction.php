<?php

namespace App\Domains\Notification\Actions;

use App\Domains\Notification\DTOs\NotificationTemplateData;
use App\Domains\Notification\Models\NotificationTemplate;

class CreateNotificationTemplateAction
{
    public function execute(NotificationTemplateData $dto): NotificationTemplate
    {
        return NotificationTemplate::create([
            'code' => $dto->code,
            'name' => $dto->name,
            'channels' => $dto->channels,
            'subject' => $dto->subject,
            'content' => $dto->content,
            'is_active' => $dto->isActive,
        ]);
    }
}
