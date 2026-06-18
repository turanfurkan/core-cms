<?php

namespace App\Domains\Marketing\Actions;

use App\Domains\Marketing\DTOs\WidgetData;
use App\Domains\Marketing\Models\MarketingWidget;

class UpdateWidgetAction
{
    public function execute(MarketingWidget $widget, WidgetData $dto): MarketingWidget
    {
        $widget->update([
            'key' => $dto->key,
            'type' => $dto->type,
            'config' => $dto->config,
            'is_active' => $dto->isActive,
        ]);

        return $widget;
    }
}
