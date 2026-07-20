<?php

namespace TuranFurkan\CoreCms\Domains\Media\Actions\Folders;

use TuranFurkan\CoreCms\Domains\Media\DTOs\FolderData;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaFolder;

class CreateFolderAction
{
    public function execute(FolderData $dto): MediaFolder
    {
        return MediaFolder::create([
            'name' => $dto->name,
            'parent_id' => $dto->parentId,
        ]);
    }
}
