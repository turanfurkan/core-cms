<?php

namespace App\Domains\Navigation\Http\Controllers;

use App\Domains\Navigation\Http\Resources\NavigationResource;
use App\Domains\Navigation\Models\Navigation;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class PublicNavigationController extends Controller
{
    public function show(string $key): NavigationResource
    {
        $cacheKey = "navigations.{$key}";

        $navigation = Cache::rememberForever($cacheKey, function () use ($key) {
            return Navigation::where('key', $key)
                ->where('is_active', true)
                ->with('rootItems')
                ->firstOrFail();
        });

        return new NavigationResource($navigation);
    }
}
