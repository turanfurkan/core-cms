<?php

namespace TuranFurkan\CoreCms\Domains\Media\Actions\Folders;

use TuranFurkan\CoreCms\Domains\Media\Models\MediaFolder;
use InvalidArgumentException;

class MoveFolderAction
{
    public function execute(MediaFolder $folder, ?int $newParentId): MediaFolder
    {
        // Prevent moving a folder into itself
        if ($newParentId !== null && $folder->id === $newParentId) {
            throw new InvalidArgumentException('Bir klasör kendisinin içerisine taşınamaz.');
        }

        // Prevent moving a folder into one of its descendants (circular dependency check)
        if ($newParentId !== null) {
            $parent = MediaFolder::find($newParentId);
            while ($parent !== null) {
                if ($parent->id === $folder->id) {
                    throw new InvalidArgumentException('Bir klasör kendi alt klasörünün içerisine taşınamaz.');
                }
                $parent = $parent->parent;
            }
        }

        $folder->update([
            'parent_id' => $newParentId,
        ]);

        return $folder;
    }
}
