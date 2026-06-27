<?php

namespace App\Domains\Post\Http\Controllers\Admin;

use App\Domains\Post\Http\Requests\PostRequest;
use App\Domains\Post\Http\Resources\PostResource;
use App\Domains\Post\Models\Post;
use App\Domains\Post\Actions\CreatePostAction;
use App\Domains\Post\Actions\UpdatePostAction;
use App\Domains\Post\Actions\DeletePostAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PostController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Post::query();

        if ($request->has('category_id') && $request->query('category_id') !== 'all') {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('categories.id', $request->query('category_id'));
            });
        }

        if ($request->has('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title->tr', 'like', "%{$search}%")
                  ->orWhere('title->en', 'like', "%{$search}%")
                  ->orWhere('slug->tr', 'like', "%{$search}%")
                  ->orWhere('slug->en', 'like', "%{$search}%");
            });
        }

        $posts = $query->with(['categories', 'coverImage', 'seo'])
            ->orderBy('id', 'desc')
            ->get();

        return PostResource::collection($posts);
    }

    public function store(PostRequest $request, CreatePostAction $action): JsonResponse
    {
        $post = $action->execute($request->validated());

        if ($request->has('seo')) {
            $post->updateSeo($request->input('seo'));
        }
        
        return (new PostResource($post->load(['categories', 'coverImage', 'seo'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Post $post): PostResource
    {
        return new PostResource($post->load(['categories', 'coverImage', 'seo']));
    }

    public function update(PostRequest $request, Post $post, UpdatePostAction $action): PostResource
    {
        $updatedPost = $action->execute($post, $request->validated());
        
        if ($request->has('seo')) {
            $updatedPost->updateSeo($request->input('seo'));
        }

        return new PostResource($updatedPost->load(['categories', 'coverImage', 'seo']));
    }

    public function destroy(Post $post, DeletePostAction $action): JsonResponse
    {
        $action->execute($post);
        return response()->json(['message' => 'Post deleted successfully.']);
    }
}
