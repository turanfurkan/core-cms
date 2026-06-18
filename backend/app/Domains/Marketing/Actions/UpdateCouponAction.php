<?php

namespace App\Domains\Marketing\Actions;

use App\Domains\Marketing\DTOs\CouponData;
use App\Domains\Marketing\Models\MarketingCoupon;

class UpdateCouponAction
{
    public function execute(MarketingCoupon $coupon, CouponData $dto): MarketingCoupon
    {
        $coupon->update([
            'code' => strtoupper($dto->code),
            'type' => $dto->type,
            'value' => $dto->value,
            'starts_at' => $dto->startsAt,
            'expires_at' => $dto->expiresAt,
            'usage_limit' => $dto->usageLimit,
            'is_active' => $dto->isActive,
        ]);

        return $coupon;
    }
}
