<?php

namespace App\Domains\Media\Actions\Files;

use App\Domains\Media\DTOs\UploadMediaData;
use App\Domains\Media\Models\MediaItem;
use App\Domains\Media\Models\MediaLibraryPlaceholder;

class UploadMediaAction
{
    public function execute(UploadMediaData $dto): MediaItem
    {
        @ini_set('memory_limit', '512M');

        $placeholder = MediaLibraryPlaceholder::firstOrCreate([
            'name' => 'global_library',
        ]);

        /** @var MediaItem $media */
        $media = $placeholder->addMedia($dto->file)
            ->toMediaCollection('default');

        $media->update([
            'folder_id' => $dto->folderId,
        ]);

        return $media;
    }
}
