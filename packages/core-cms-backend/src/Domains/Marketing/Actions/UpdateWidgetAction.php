<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Actions;

use TuranFurkan\CoreCms\Domains\Marketing\DTOs\WidgetData;
use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingWidget;

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
