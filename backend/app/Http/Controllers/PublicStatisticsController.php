<?php

namespace App\Http\Controllers;

use TuranFurkan\CoreCms\Domains\Race\Models\Race;
use TuranFurkan\CoreCms\Domains\Category\Models\Category;
use TuranFurkan\CoreCms\Domains\Billing\Models\Order;
use TuranFurkan\CoreCms\Domains\Communication\Models\Subscriber;
use TuranFurkan\CoreCms\Domains\Post\Models\Post;
use Illuminate\Http\JsonResponse;

class PublicStatisticsController extends Controller
{
    public function counts(): JsonResponse
    {
        // Query counts safely
        $racesCount = Race::where('status', 'published')->count();
        $categoriesCount = Category::where('is_active', true)->count();
        $ordersCount = Order::count();
        $subscribersCount = Subscriber::count();
        
        // Count posts that are published
        $postsCount = Post::where('status', 'published')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'races_count' => $racesCount,
                'categories_count' => $categoriesCount,
                'orders_count' => $ordersCount,
                'subscribers_count' => $subscribersCount,
                'posts_count' => $postsCount,
            ]
        ]);
    }
}

