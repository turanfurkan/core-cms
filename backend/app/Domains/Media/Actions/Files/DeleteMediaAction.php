<?php

namespace App\Domains\Media\Actions\Files;

use App\Domains\Media\Models\MediaItem;

class DeleteMediaAction
{
    public function execute(MediaItem $media): bool
    {
        return (bool) $media->delete();
    }
}
