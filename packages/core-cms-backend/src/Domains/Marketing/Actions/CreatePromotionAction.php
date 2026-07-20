<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Actions;

use TuranFurkan\CoreCms\Domains\Marketing\DTOs\PromotionData;
use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingPromotion;

class CreatePromotionAction
{
    public function execute(PromotionData $dto): MarketingPromotion
    {
        return MarketingPromotion::create([
            'name' => $dto->name,
            'type' => $dto->type,
            'content' => $dto->content,
            'rules' => $dto->rules,
            'is_active' => $dto->isActive,
        ]);
    }
}
