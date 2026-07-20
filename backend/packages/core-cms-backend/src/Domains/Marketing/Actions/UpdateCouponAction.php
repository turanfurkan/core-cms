<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Actions;

use TuranFurkan\CoreCms\Domains\Marketing\DTOs\CouponData;
use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingCoupon;

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
