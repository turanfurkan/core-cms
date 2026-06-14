<?php

namespace App\Domains\Content\Support;

use App\Domains\Content\Models\ContentType;
use Illuminate\Support\Str;

class ContentSlugHelper
{
    public static function generate(
        ContentType $contentType,
        string $fieldSlug,
        mixed $sourceValue,
        ?int $ignoreEntryId = null
    ): mixed {
        if (is_array($sourceValue)) {
            $localizedSlugs = [];
            foreach ($sourceValue as $locale => $text) {
                if ($text !== null && $text !== '') {
                    $localizedSlugs[$locale] = self::generateSingle($contentType, $fieldSlug, $text, $ignoreEntryId, $locale);
                }
            }
            return $localizedSlugs;
        }

        if ($sourceValue !== null && $sourceValue !== '') {
            return self::generateSingle($contentType, $fieldSlug, $sourceValue, $ignoreEntryId);
        }

        return null;
    }

    protected static function generateSingle(
        ContentType $contentType,
        string $fieldSlug,
        string $text,
        ?int $ignoreEntryId = null,
        ?string $locale = null
    ): string {
        $baseSlug = Str::slug($text);
        if (empty($baseSlug)) {
            $baseSlug = 'content';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (!self::isUnique($contentType, $fieldSlug, $slug, $ignoreEntryId, $locale)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    protected static function isUnique(
        ContentType $contentType,
        string $fieldSlug,
        string $slug,
        ?int $ignoreEntryId = null,
        ?string $locale = null
    ): bool {
        $query = $contentType->entries();

        if ($ignoreEntryId !== null) {
            $query->where('id', '!=', $ignoreEntryId);
        }

        if ($locale !== null) {
            $query->where("data->{$fieldSlug}->{$locale}", $slug);
        } else {
            $query->where("data->{$fieldSlug}", $slug);
        }

        return !$query->exists();
    }
}
