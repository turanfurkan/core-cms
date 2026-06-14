<?php

namespace App\Domains\Content\Actions\Entries;

use App\Domains\Content\Models\ContentEntry;

class DeleteContentEntryAction
{
    public function execute(ContentEntry $entry): bool
    {
        $contentTypeSlug = $entry->contentType->slug;
        $deleted = $entry->delete();
        if ($deleted) {
            \App\Domains\Content\Support\ContentCacheHelper::invalidate($contentTypeSlug);
        }
        return $deleted;
    }
}
