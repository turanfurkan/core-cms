<?php

namespace TuranFurkan\CoreCms\Domains\Media\Actions\Files;

use TuranFurkan\CoreCms\Domains\Media\Models\MediaItem;

class MoveMediaAction
{
    public function execute(MediaItem $media, ?int $newFolderId): MediaItem
    {
        $media->update([
            'folder_id' => $newFolderId,
        ]);

        return $media;
    }
}
