<?php

namespace App\Domains\Media\Actions\Folders;

use App\Domains\Media\Models\MediaFolder;
use Illuminate\Support\Facades\DB;

class DeleteFolderAction
{
    public function execute(MediaFolder $folder): bool
    {
        return DB::transaction(function () use ($folder) {
            // Cascade delete on database will handle subfolders
            // Media table nullable foreign key nullOnDelete handles media items
            return (bool) $folder->delete();
        });
    }
}
