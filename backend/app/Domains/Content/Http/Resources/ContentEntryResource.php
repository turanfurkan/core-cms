<?php

namespace App\Domains\Content\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domains\Content\Models\ContentEntry
 */
class ContentEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $resolvedData = $this->data;
        $contentType = $this->contentType;

        // Apply monetization masking if it's not an admin request
        $isAdmin = $request->is('api/admin/*') || $request->is('admin/*');
        if (!$isAdmin && $contentType && data_get($contentType->settings, 'monetization.enabled')) {
            $accessType = data_get($resolvedData, 'access_type', 'free');
            if ($accessType !== 'free') {
                $user = auth()->user() ?? auth('sanctum')->user();
                $hasPurchased = false;
                if ($user) {
                    $hasPurchased = \App\Domains\Billing\Models\Order::where('user_id', $user->id)
                        ->where('orderable_type', \App\Domains\Content\Models\ContentEntry::class)
                        ->where('orderable_id', $this->id)
                        ->where('status', 'paid')
                        ->exists();
                }

                if (!$hasPurchased) {
                    $resolvedData = [
                        'title' => $resolvedData['title'] ?? '',
                        'slug' => $resolvedData['slug'] ?? '',
                        'summary' => $resolvedData['summary'] ?? 'Bu içerik ödeme duvarı arkasındadır. Okumak için satın alın.',
                        'cover_image' => $resolvedData['cover_image'] ?? null,
                        'access_blocked' => true,
                        'price' => $resolvedData['price'] ?? 0,
                        'currency' => $resolvedData['currency'] ?? 'TRY',
                        'access_type' => $accessType,
                    ];
                }
            }
        }

        if ($contentType) {
            if (!$contentType->relationLoaded('fields')) {
                $contentType->load('fields');
            }

            $mediaFields = $contentType->fields->whereIn('type', ['media', 'gallery', 'media_gallery']);
            foreach ($mediaFields as $field) {
                $mediaValue = $resolvedData[$field->slug] ?? null;
                if ($mediaValue) {
                    $resolvedData[$field->slug] = $this->resolveMedia($mediaValue);
                }
            }

            // Hydrate dynamic zone blocks
            $dynamicZoneFields = $contentType->fields->where('type', 'dynamic_zone');
            foreach ($dynamicZoneFields as $field) {
                $blocksValue = $resolvedData[$field->slug] ?? null;
                if (is_array($blocksValue)) {
                    foreach ($blocksValue as $index => &$block) {
                        if (!is_array($block) || !isset($block['type']) || !isset($block['data'])) {
                            continue;
                        }

                        $blockType = $block['type'];
                        $blockData = $block['data'];
                        $allowedBlocks = $field->options['allowed_blocks'] ?? [];
                        $blockSchema = collect($allowedBlocks)->firstWhere('type', $blockType);

                        if ($blockSchema && isset($blockSchema['fields']) && is_array($blockSchema['fields'])) {
                            foreach ($blockSchema['fields'] as $subField) {
                                $subSlug = $subField['slug'];
                                $subVal = $blockData[$subSlug] ?? null;
                                if (!$subVal) {
                                    continue;
                                }

                                // Hydrate Media inside block
                                if (in_array($subField['type'], ['media', 'gallery', 'media_gallery'])) {
                                    $blockData[$subSlug] = $this->resolveMedia($subVal);
                                }

                                // Hydrate target content type relation inside block
                                if (($subField['type'] === 'relation_content_type' || $subSlug === 'target_content_type_id' || $subField['type'] === 'relation') && $subVal) {
                                    $targetContentType = \App\Domains\Content\Models\ContentType::where('id', $subVal)
                                        ->orWhere('slug', $subVal)
                                        ->first();

                                    if ($targetContentType) {
                                        $limit = $blockData['limit'] ?? 10;
                                        $entries = $targetContentType->entries()
                                            ->where('status', 'published')
                                            ->where(function ($q) {
                                                $q->whereNull('published_at')
                                                  ->orWhere('published_at', '<=', now());
                                            })
                                            ->limit($limit)
                                            ->get();

                                        $entries->load('seo');
                                        $block['hydrated_data'] = ContentEntryResource::collection($entries)->toArray($request);
                                    }
                                }
                            }
                        }
                        $block['data'] = $blockData;
                    }
                    $resolvedData[$field->slug] = $blocksValue;
                }
            }
        }

        return [
            'id' => $this->id,
            'content_type_id' => $this->content_type_id,
            'data' => $resolvedData,
            'status' => $this->status,
            'seo' => $this->when($this->relationLoaded('seo') && $this->seo !== null, function() {
                return [
                    'meta_title' => $this->seo->meta_title,
                    'meta_description' => $this->seo->meta_description,
                    'meta_keywords' => $this->seo->meta_keywords,
                    'og_title' => $this->seo->og_title,
                    'og_description' => $this->seo->og_description,
                    'og_image_id' => $this->seo->og_image_id,
                    'canonical_url' => $this->seo->canonical_url,
                    'meta_robots' => $this->seo->meta_robots,
                ];
            }),
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function resolveMedia($mediaValue)
    {
        if (!$mediaValue) {
            return $mediaValue;
        }

        if (is_array($mediaValue)) {
            // Check if it is localized (associative array with locale keys)
            $isLocalized = false;
            foreach (array_keys($mediaValue) as $key) {
                if (is_string($key)) {
                    $isLocalized = true;
                    break;
                }
            }

            if ($isLocalized) {
                foreach ($mediaValue as $locale => $locVal) {
                    if ($locVal) {
                        if (is_array($locVal)) {
                            $mediaValue[$locale] = \Illuminate\Support\Facades\DB::table('media')
                                ->whereIn('id', $locVal)
                                ->get()
                                ->map(fn($media) => [
                                    'id' => $media->id,
                                    'name' => $media->name,
                                    'file_name' => $media->file_name,
                                    'url' => asset("storage/{$media->id}/{$media->file_name}"),
                                    'size' => $media->size,
                                    'mime_type' => $media->mime_type,
                                ])
                                ->toArray();
                        } else {
                            $media = \Illuminate\Support\Facades\DB::table('media')
                                ->where('id', $locVal)
                                ->first();
                            if ($media) {
                                $mediaValue[$locale] = [
                                    'id' => $media->id,
                                    'name' => $media->name,
                                    'file_name' => $media->file_name,
                                    'url' => asset("storage/{$media->id}/{$media->file_name}"),
                                    'size' => $media->size,
                                    'mime_type' => $media->mime_type,
                                ];
                            }
                        }
                    }
                }
                return $mediaValue;
            } else {
                return \Illuminate\Support\Facades\DB::table('media')
                    ->whereIn('id', $mediaValue)
                    ->get()
                    ->map(fn($media) => [
                        'id' => $media->id,
                        'name' => $media->name,
                        'file_name' => $media->file_name,
                        'url' => asset("storage/{$media->id}/{$media->file_name}"),
                        'size' => $media->size,
                        'mime_type' => $media->mime_type,
                    ])
                    ->toArray();
            }
        } else {
            $media = \Illuminate\Support\Facades\DB::table('media')
                ->where('id', $mediaValue)
                ->first();
            if ($media) {
                return [
                    'id' => $media->id,
                    'name' => $media->name,
                    'file_name' => $media->file_name,
                    'url' => asset("storage/{$media->id}/{$media->file_name}"),
                    'size' => $media->size,
                    'mime_type' => $media->mime_type,
                ];
            }
        }

        return $mediaValue;
    }
}
