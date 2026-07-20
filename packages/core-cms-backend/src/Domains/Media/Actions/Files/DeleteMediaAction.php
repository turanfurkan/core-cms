<?php

namespace TuranFurkan\CoreCms\Domains\Media\Actions\Files;

use TuranFurkan\CoreCms\Domains\Media\Models\MediaItem;

class DeleteMediaAction
{
    public function execute(MediaItem $media): bool
    {
        return (bool) $media->delete();
    }
}
