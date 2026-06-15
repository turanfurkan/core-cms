<?php

namespace App\Domains\Notification\Actions;

use App\Domains\Notification\DTOs\NotificationTemplateData;
use App\Domains\Notification\Models\NotificationTemplate;

class UpdateNotificationTemplateAction
{
    public function execute(NotificationTemplate $template, NotificationTemplateData $dto): NotificationTemplate
    {
        $template->update([
            'code' => $dto->code,
            'name' => $dto->name,
            'channels' => $dto->channels,
            'subject' => $dto->subject,
            'content' => $dto->content,
            'is_active' => $dto->isActive,
        ]);

        return $template->fresh();
    }
}
