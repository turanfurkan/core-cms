<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Actions;

use TuranFurkan\CoreCms\Domains\Marketing\DTOs\CouponData;
use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingCoupon;

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
