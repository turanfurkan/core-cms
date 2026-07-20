<?php

namespace TuranFurkan\CoreCms\Domains\Post\Http\Controllers\Public;

use TuranFurkan\CoreCms\Domains\Post\Http\Resources\PostResource;
use TuranFurkan\CoreCms\Domains\Post\Models\Post;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * List all published posts with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('limit', 12);
        
        $query = Post::published()
            ->with(['categories', 'coverImage', 'seo'])
            ->orderBy('publish_date', 'desc')
            ->orderBy('id', 'desc');

        // Apply category filter if passed
        $filters = $request->input('filters', []);
        if (isset($filters['category_id']) && $filters['category_id'] !== 'all') {
            $query->whereHas('categories', function ($q) use ($filters) {
                $q->where('categories.id', $filters['category_id']);
            });
        }

        $posts = $query->paginate($perPage);
        
        $responseData = PostResource::collection($posts)->toResponse(request())->getData(true);
        
        return response()->json($responseData);
    }

    /**
     * Get a single published post by slug.
     */
    public function show(string $slug): JsonResponse
    {
        $post = Post::published()
            ->where(function ($query) use ($slug) {
                $query->where('slug', $slug)
                    ->orWhere('slug->tr', $slug)
                    ->orWhere('slug->en', $slug);
            })
            ->with(['categories', 'coverImage', 'seo'])
            ->firstOrFail();

        $responseData = (new PostResource($post))->toResponse(request())->getData(true);
        
        return response()->json($responseData);
    }
}
