<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Actions;

use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingCoupon;

class RedeemCouponAction
{
    public function execute(MarketingCoupon $coupon): MarketingCoupon
    {
        $coupon->increment('used_count');

        return $coupon->fresh();
    }
}
