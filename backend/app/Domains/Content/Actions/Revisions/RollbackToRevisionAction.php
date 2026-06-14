<?php

namespace App\Domains\Content\Actions\Revisions;

use App\Domains\Content\Models\ContentEntry;
use App\Domains\Content\Models\ContentRevision;
use Illuminate\Support\Facades\DB;

class RollbackToRevisionAction
{
    public function execute(ContentEntry $entry, ContentRevision $revision, ?int $userId = null): ContentEntry
    {
        // Ensure the revision belongs to this entry
        if ($revision->content_entry_id !== $entry->id) {
            throw new \InvalidArgumentException("The revision does not belong to the content entry.");
        }

        return DB::transaction(function () use ($entry, $revision, $userId) {
            $rollbackData = $revision->data;

            // Update the entry content data
            $entry->update([
                'data' => $rollbackData,
                'updated_by' => $userId,
            ]);

            // Create a new revision reflecting this rollback version
            $latestVersion = (int) $entry->revisions()->max('version') ?: 0;
            ContentRevision::create([
                'content_entry_id' => $entry->id,
                'data' => $rollbackData,
                'version' => $latestVersion + 1,
                'created_by' => $userId,
            ]);

            // Invalidate delivery caches
            \App\Domains\Content\Support\ContentCacheHelper::invalidate($entry->contentType->slug);

            return $entry;
        });
    }
}
