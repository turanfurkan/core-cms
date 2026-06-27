<?php

namespace App\Domains\Post\Actions;

use App\Domains\Post\Models\Post;
use Illuminate\Support\Facades\DB;

class UpdatePostAction
{
    public function execute(Post $post, array $data): Post
    {
        return DB::transaction(function () use ($post, $data) {
            $categoryIds = $data['category_ids'] ?? [];
            $data['updated_by'] = auth()->id();

            // Update the post instance
            $post->update($data);

            // Sync categories polymorphically
            $post->categories()->sync($categoryIds);

            return $post;
        });
    }
}
