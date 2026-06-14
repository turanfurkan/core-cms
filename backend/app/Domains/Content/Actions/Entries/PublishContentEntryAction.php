<?php

namespace App\Domains\Content\Actions\Entries;

use App\Domains\Content\Models\ContentEntry;

class PublishContentEntryAction
{
    public function execute(ContentEntry $entry, string $status = ContentEntry::STATUS_PUBLISHED): ContentEntry
    {
        $payload = [
            'status' => $status,
        ];

        if ($status === ContentEntry::STATUS_PUBLISHED) {
            $payload['published_at'] = now();
        } else {
            $payload['published_at'] = null;
        }

        $entry->update($payload);

        \App\Domains\Content\Support\ContentCacheHelper::invalidate($entry->contentType->slug);

        return $entry;
    }
}
