<?php

namespace App\Domains\Marketing\Actions;

use App\Domains\Marketing\DTOs\PromotionData;
use App\Domains\Marketing\Models\MarketingPromotion;

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
