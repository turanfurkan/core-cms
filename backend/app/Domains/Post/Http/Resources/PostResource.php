<?php

namespace App\Domains\Post\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domains\Post\Models\Post
 */
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $coverImageData = null;
        if ($this->relationLoaded('coverImage') && $this->coverImage) {
            $coverImageData = [
                'id' => $this->coverImage->id,
                'name' => $this->coverImage->name,
                'file_name' => $this->coverImage->file_name,
                'url' => $this->coverImage->getUrl(),
                'size' => $this->coverImage->size,
                'mime_type' => $this->coverImage->mime_type,
            ];
        }

        $content = $this->content;

        return [
            'id' => $this->id,
            'data' => [
                'title' => $this->title,
                'slug' => $this->slug,
                'content' => is_array($content) && count($content) > 0 && is_array(reset($content)) && isset(reset($content)['type'])
                    ? $this->hydrateBlocks($content)
                    : $content,
                'summary' => $this->summary,
                'reading_time' => $this->reading_time,
                'cover_image' => $coverImageData,
                'category_ids' => $this->whenLoaded('categories', function () {
                    return $this->categories->pluck('id')->toArray();
                }),
                'categories' => $this->whenLoaded('categories', function () {
                    return $this->categories->map(fn($cat) => [
                        'id' => $cat->id,
                        'name' => $cat->name,
                        'slug' => $cat->slug,
                        'type' => $cat->type,
                    ]);
                }),
            ],
            'status' => $this->status,
            'published_at' => $this->publish_date ?? $this->created_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
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
        ];
    }

    /**
     * Parse content blocks and hydrate showcase blocks with actual DB models.
     */
    protected function hydrateBlocks(array $blocks): array
    {
        $raceIds = [];
        $categoryIds = [];
        $mediaIds = [];

        foreach ($blocks as $block) {
            if (($block['type'] ?? '') === 'entity_showcase') {
                $type = $block['data']['entity_type'] ?? '';
                $ids = $block['data']['entity_ids'] ?? [];
                if (is_array($ids)) {
                    if ($type === 'race') {
                        $raceIds = array_merge($raceIds, $ids);
                    } elseif ($type === 'category') {
                        $categoryIds = array_merge($categoryIds, $ids);
                    }
                }
            } elseif (($block['type'] ?? '') === 'image') {
                $imgId = $block['data']['image_id'] ?? null;
                if ($imgId) {
                    $mediaIds[] = $imgId;
                }
            }
        }

        $races = [];
        if (!empty($raceIds)) {
            $races = \App\Domains\Race\Models\Race::with(['coverImage', 'categories'])
                ->whereIn('id', array_unique($raceIds))
                ->get()
                ->keyBy('id');
        }

        $categories = [];
        if (!empty($categoryIds)) {
            $categories = \App\Domains\Category\Models\Category::whereIn('id', array_unique($categoryIds))
                ->get()
                ->keyBy('id');
        }

        $mediaItems = [];
        if (!empty($mediaIds)) {
            $mediaItems = \App\Domains\Media\Models\MediaItem::whereIn('id', array_unique($mediaIds))
                ->get()
                ->keyBy('id');
        }

        return array_map(function ($block) use ($races, $categories, $mediaItems) {
            if (($block['type'] ?? '') === 'entity_showcase') {
                $type = $block['data']['entity_type'] ?? '';
                $ids = $block['data']['entity_ids'] ?? [];
                $resolved = [];

                if (is_array($ids)) {
                    foreach ($ids as $id) {
                        if ($type === 'race' && isset($races[$id])) {
                            $resolved[] = (new \App\Domains\Race\Http\Resources\RaceResource($races[$id]))->toArray(request());
                        } elseif ($type === 'category' && isset($categories[$id])) {
                            $resolved[] = (new \App\Domains\Category\Http\Resources\CategoryResource($categories[$id]))->toArray(request());
                        }
                    }
                }
                $block['resolved_data'] = $resolved;
            } elseif (($block['type'] ?? '') === 'image') {
                $imgId = $block['data']['image_id'] ?? null;
                if ($imgId && isset($mediaItems[$imgId])) {
                    $block['resolved_image'] = (new \App\Domains\Media\Http\Resources\MediaResource($mediaItems[$imgId]))->toArray(request());
                }
            }
            return $block;
        }, $blocks);
    }
}
