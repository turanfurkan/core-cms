<?php

namespace App\Domains\Post\Actions;

use App\Domains\Post\Models\Post;

class DeletePostAction
{
    public function execute(Post $post): bool
    {
        return $post->delete();
    }
}
