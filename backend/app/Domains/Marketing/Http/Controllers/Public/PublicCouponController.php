<?php

namespace App\Domains\Marketing\Http\Controllers\Public;

use App\Domains\Marketing\Actions\RedeemCouponAction;
use App\Domains\Marketing\Actions\ValidateCouponAction;
use App\Domains\Marketing\Http\Resources\CouponResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCouponController extends Controller
{
    public function validateCoupon(Request $request, ValidateCouponAction $action): CouponResource
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $coupon = $action->execute($request->input('code'));

        return new CouponResource($coupon);
    }

    public function redeemCoupon(Request $request, ValidateCouponAction $validateAction, RedeemCouponAction $redeemAction): CouponResource
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $coupon = $validateAction->execute($request->input('code'));
        $updated = $redeemAction->execute($coupon);

        return new CouponResource($updated);
    }
}
