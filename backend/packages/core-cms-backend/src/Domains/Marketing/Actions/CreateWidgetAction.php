<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Actions;

use TuranFurkan\CoreCms\Domains\Marketing\DTOs\WidgetData;
use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingWidget;

class CreateWidgetAction
{
    public function execute(WidgetData $dto): MarketingWidget
    {
        return MarketingWidget::create([
            'key' => $dto->key,
            'type' => $dto->type,
            'config' => $dto->config,
            'is_active' => $dto->isActive,
        ]);
    }
}
