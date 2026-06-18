<?php

namespace App\Domains\Marketing\Actions;

use App\Domains\Marketing\DTOs\PromotionData;
use App\Domains\Marketing\Models\MarketingPromotion;

class UpdatePromotionAction
{
    public function execute(MarketingPromotion $promotion, PromotionData $dto): MarketingPromotion
    {
        $promotion->update([
            'name' => $dto->name,
            'type' => $dto->type,
            'content' => $dto->content,
            'rules' => $dto->rules,
            'is_active' => $dto->isActive,
        ]);

        return $promotion;
    }
}
