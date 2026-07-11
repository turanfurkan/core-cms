<?php

namespace App\Http\Controllers;

use App\Domains\Race\Models\Race;
use App\Domains\Category\Models\Category;
use App\Domains\Billing\Models\Order;
use App\Domains\Communication\Models\Subscriber;
use App\Domains\Post\Models\Post;
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

