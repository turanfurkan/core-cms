<?php

namespace App\Domains\Marketing\Actions;

use App\Domains\Marketing\DTOs\WidgetData;
use App\Domains\Marketing\Models\MarketingWidget;

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
