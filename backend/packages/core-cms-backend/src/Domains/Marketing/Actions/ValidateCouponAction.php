<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Actions;

use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingCoupon;
use Illuminate\Validation\ValidationException;

class ValidateCouponAction
{
    public function execute(string $code): MarketingCoupon
    {
        $coupon = MarketingCoupon::where('code', strtoupper($code))->first();

        if (!$coupon || !$coupon->isValid()) {
            throw ValidationException::withMessages([
                'code' => ['The provided coupon code is invalid, expired, or has reached its usage limit.'],
            ]);
        }

        return $coupon;
    }
}
