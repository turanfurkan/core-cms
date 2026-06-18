<?php

namespace App\Domains\Marketing\Http\Controllers\Admin;

use App\Domains\Marketing\Actions\CreatePromotionAction;
use App\Domains\Marketing\Actions\UpdatePromotionAction;
use App\Domains\Marketing\DTOs\PromotionData;
use App\Domains\Marketing\Http\Requests\PromotionRequest;
use App\Domains\Marketing\Http\Resources\PromotionResource;
use App\Domains\Marketing\Models\MarketingPromotion;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminPromotionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $promotions = MarketingPromotion::orderBy('id', 'desc')->paginate($request->input('limit', 15));

        return PromotionResource::collection($promotions);
    }

    public function store(PromotionRequest $request, CreatePromotionAction $action): PromotionResource
    {
        $dto = PromotionData::fromRequest($request);
        $promotion = $action->execute($dto);

        return new PromotionResource($promotion);
    }

    public function show(MarketingPromotion $promotion): PromotionResource
    {
        return new PromotionResource($promotion);
    }

    public function update(MarketingPromotion $promotion, PromotionRequest $request, UpdatePromotionAction $action): PromotionResource
    {
        $dto = PromotionData::fromRequest($request);
        $updated = $action->execute($promotion, $dto);

        return new PromotionResource($updated);
    }

    public function destroy(MarketingPromotion $promotion): JsonResponse
    {
        $promotion->delete();

        return response()->json([
            'message' => 'Promotion deleted successfully.',
        ]);
    }
}
