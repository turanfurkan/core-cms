<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Marketing\Actions\CreateCouponAction;
use TuranFurkan\CoreCms\Domains\Marketing\Actions\UpdateCouponAction;
use TuranFurkan\CoreCms\Domains\Marketing\DTOs\CouponData;
use TuranFurkan\CoreCms\Domains\Marketing\Http\Requests\CouponRequest;
use TuranFurkan\CoreCms\Domains\Marketing\Http\Resources\CouponResource;
use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingCoupon;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminCouponController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $coupons = MarketingCoupon::orderBy('id', 'desc')->paginate($request->input('limit', 15));

        return CouponResource::collection($coupons);
    }

    public function store(CouponRequest $request, CreateCouponAction $action): CouponResource
    {
        $dto = CouponData::fromRequest($request);
        $coupon = $action->execute($dto);

        return new CouponResource($coupon);
    }

    public function show(MarketingCoupon $coupon): CouponResource
    {
        return new CouponResource($coupon);
    }

    public function update(MarketingCoupon $coupon, CouponRequest $request, UpdateCouponAction $action): CouponResource
    {
        $dto = CouponData::fromRequest($request);
        $updated = $action->execute($coupon, $dto);

        return new CouponResource($updated);
    }

    public function destroy(MarketingCoupon $coupon): JsonResponse
    {
        $coupon->delete();

        return response()->json([
            'message' => 'Coupon deleted successfully.',
        ]);
    }
}
