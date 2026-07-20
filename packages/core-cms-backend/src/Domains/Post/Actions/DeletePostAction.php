<?php

namespace TuranFurkan\CoreCms\Domains\Post\Actions;

use TuranFurkan\CoreCms\Domains\Post\Models\Post;

class DeletePostAction
{
    public function execute(Post $post): bool
    {
        return $post->delete();
    }
}
