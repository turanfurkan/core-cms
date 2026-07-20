<?php

namespace TuranFurkan\CoreCms\Domains\Media\Actions\Files;

use TuranFurkan\CoreCms\Domains\Media\DTOs\UploadMediaData;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaItem;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaLibraryPlaceholder;

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
