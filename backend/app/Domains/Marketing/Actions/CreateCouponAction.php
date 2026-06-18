<?php

namespace App\Domains\Marketing\Actions;

use App\Domains\Marketing\DTOs\CouponData;
use App\Domains\Marketing\Models\MarketingCoupon;

class CreateCouponAction
{
    public function execute(CouponData $dto): MarketingCoupon
    {
        return MarketingCoupon::create([
            'code' => strtoupper($dto->code),
            'type' => $dto->type,
            'value' => $dto->value,
            'starts_at' => $dto->startsAt,
            'expires_at' => $dto->expiresAt,
            'usage_limit' => $dto->usageLimit,
            'is_active' => $dto->isActive,
        ]);
    }
}
