<?php

namespace App\Domains\Post\Actions;

use App\Domains\Post\Models\Post;
use Illuminate\Support\Facades\DB;

class CreatePostAction
{
    public function execute(array $data): Post
    {
        return DB::transaction(function () use ($data) {
            $categoryIds = $data['category_ids'] ?? [];
            $data['created_by'] = auth()->id();

            // Create the post instance
            $post = Post::create($data);

            // Sync categories polymorphically
            $post->categories()->sync($categoryIds);

            return $post;
        });
    }
}
