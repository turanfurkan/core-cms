<?php

namespace App\Domains\Content\Actions\Entries;

use App\Domains\Content\DTOs\ContentEntryData;
use App\Domains\Content\Models\ContentEntry;
use App\Domains\Content\Models\ContentType;
use App\Domains\Content\Models\ContentRevision;
use App\Domains\Content\Support\EntryValidator;
use Illuminate\Support\Facades\DB;

class CreateContentEntryAction
{
    public function execute(ContentType $contentType, ContentEntryData $dto, ?int $userId = null): ContentEntry
    {
        return DB::transaction(function () use ($contentType, $dto, $userId) {
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
                            $sourceValue
                        );
                    }
                }
            }

            // 1. Dynamic validation
            $validatedData = EntryValidator::validate($contentType, $inputData);

            // 2. Create the entry
            $entry = ContentEntry::create([
                'content_type_id' => $contentType->id,
                'data' => $validatedData,
                'status' => $dto->status,
                'created_by' => $userId,
                'updated_by' => $userId,
                'published_at' => $dto->status === ContentEntry::STATUS_PUBLISHED ? now() : null,
            ]);

            // 3. Create version 1 revision
            ContentRevision::create([
                'content_entry_id' => $entry->id,
                'data' => $validatedData,
                'version' => 1,
                'created_by' => $userId,
            ]);

            // 4. Save SEO metadata if present
            if ($dto->seo !== null) {
                $entry->updateSeo($dto->seo);
            }

            // 5. Invalidate delivery caches for this content type
            \App\Domains\Content\Support\ContentCacheHelper::invalidate($contentType->slug);

            return $entry;
        });
    }
}
