<?php

namespace App\Domains\Content\Actions\Entries;

use App\Domains\Content\DTOs\ContentEntryData;
use App\Domains\Content\Models\ContentEntry;
use App\Domains\Content\Models\ContentRevision;
use App\Domains\Content\Support\EntryValidator;
use Illuminate\Support\Facades\DB;

class UpdateContentEntryAction
{
    public function execute(ContentEntry $entry, ContentEntryData $dto, ?int $userId = null): ContentEntry
    {
        return DB::transaction(function () use ($entry, $dto, $userId) {
            $contentType = $entry->contentType;

            // Auto-Slug Generation logic
            $inputData = $dto->data;
            foreach ($contentType->fields as $field) {
                if ($field->type === 'slug') {
                    $slugVal = $inputData[$field->slug] ?? null;
                    if ($slugVal === null || $slugVal === '' || (is_array($slugVal) && empty(array_filter($slugVal)))) {
                        $sourceField = $field->options['source'] ?? 'title';
                        $sourceValue = $inputData[$sourceField] ?? 'content';
                        $inputData[$field->slug] = \App\Domains\Content\Support\ContentSlugHelper::generate(
                            $contentType,
                            $field->slug,
                            $sourceValue,
                            $entry->id
                        );
                    }
                }
            }

            // 1. Dynamic validation
            $validatedData = EntryValidator::validate($contentType, $inputData);

            // 2. Check if data is modified to handle revisions
            $hasDataChanged = serialize($entry->data) !== serialize($validatedData);

            // 3. Update entry
            $updatePayload = [
                'data' => $validatedData,
                'status' => $dto->status,
                'updated_by' => $userId,
            ];

            if ($dto->status === ContentEntry::STATUS_PUBLISHED && !$entry->isPublished()) {
                $updatePayload['published_at'] = now();
            }

            $entry->update($updatePayload);

            // 4. Create new revision if data changed
            if ($hasDataChanged) {
                $latestVersion = (int) $entry->revisions()->max('version') ?: 0;
                ContentRevision::create([
                    'content_entry_id' => $entry->id,
                    'data' => $validatedData,
                    'version' => $latestVersion + 1,
                    'created_by' => $userId,
                ]);
            }

            // 5. Save SEO metadata if present
            if ($dto->seo !== null) {
                $entry->updateSeo($dto->seo);
            }

            // 6. Invalidate delivery caches for this content type
            \App\Domains\Content\Support\ContentCacheHelper::invalidate($contentType->slug);

            return $entry;
        });
    }
}
