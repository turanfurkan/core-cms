<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Public;

use TuranFurkan\CoreCms\Domains\Marketing\Http\Resources\PromotionResource;
use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingPromotion;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicPromotionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $path = $request->input('path');
        $query = MarketingPromotion::where('is_active', true);

        $promotions = $query->get();

        if ($path) {
            $promotions = $promotions->filter(function (MarketingPromotion $promo) use ($path) {
                if (empty($promo->rules) || empty($promo->rules['paths'])) {
                    return true;
                }

                foreach ($promo->rules['paths'] as $pattern) {
                    if (str()->is($pattern, $path)) {
                        return true;
                    }
                }

                return false;
            });
        }

        return PromotionResource::collection($promotions);
    }
}
