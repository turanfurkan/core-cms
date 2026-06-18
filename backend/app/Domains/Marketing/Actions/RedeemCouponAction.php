<?php

namespace App\Domains\Marketing\Actions;

use App\Domains\Marketing\Models\MarketingCoupon;

class RedeemCouponAction
{
    public function execute(MarketingCoupon $coupon): MarketingCoupon
    {
        $coupon->increment('used_count');

        return $coupon->fresh();
    }
}
