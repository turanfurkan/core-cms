<?php

namespace App\Domains\Media\Actions\Files;

use App\Domains\Media\Models\MediaItem;

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
