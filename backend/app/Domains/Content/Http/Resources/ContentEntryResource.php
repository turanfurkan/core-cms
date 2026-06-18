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

        if ($contentType) {
            if (!$contentType->relationLoaded('fields')) {
                $contentType->load('fields');
            }

            $mediaFields = $contentType->fields->whereIn('type', ['media', 'gallery', 'media_gallery']);
            foreach ($mediaFields as $field) {
                $mediaValue = $resolvedData[$field->slug] ?? null;
                if ($mediaValue) {
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
                            $resolvedData[$field->slug] = $mediaValue;
                        } else {
                            $mediaItems = \Illuminate\Support\Facades\DB::table('media')
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
                            $resolvedData[$field->slug] = $mediaItems;
                        }
                    } else {
                        $media = \Illuminate\Support\Facades\DB::table('media')
                            ->where('id', $mediaValue)
                            ->first();
                        if ($media) {
                            $resolvedData[$field->slug] = [
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
}
