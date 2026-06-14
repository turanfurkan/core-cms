<?php

namespace App\Domains\Media\Actions\Folders;

use App\Domains\Media\DTOs\FolderData;
use App\Domains\Media\Models\MediaFolder;

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
