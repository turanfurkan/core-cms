<?php

namespace TuranFurkan\CoreCms\Domains\Media\Actions\Files;

use TuranFurkan\CoreCms\Domains\Media\DTOs\MediaMetaData;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaItem;

class UpdateMediaMetaAction
{
    public function execute(MediaItem $media, MediaMetaData $dto): MediaItem
    {
        if ($dto->altText !== null) {
            $media->setCustomProperty('alt_text', $dto->altText);
        }
        if ($dto->title !== null) {
            $media->setCustomProperty('title', $dto->title);
        }
        if ($dto->description !== null) {
            $media->setCustomProperty('description', $dto->description);
        }
        if ($dto->caption !== null) {
            $media->setCustomProperty('caption', $dto->caption);
        }

        $media->save();

        return $media;
    }
}
