<?php

namespace TuranFurkan\CoreCms\Domains\Page\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \TuranFurkan\CoreCms\Domains\Page\Models\Page
 */
class PageResource extends JsonResource
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
                'layout' => $this->layout,
                'is_system' => $this->is_system,
                'is_homepage' => $this->is_homepage,
                'parent_id' => $this->parent_id,
                'order' => $this->order,
                'cover_image' => $coverImageData,
            ],
            'status' => $this->status,
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
        $globalBlockIds = [];
        foreach ($blocks as $block) {
            if (($block['type'] ?? '') === 'global_block_ref') {
                $gbId = $block['content']['global_block_id'] ?? null;
                if ($gbId) {
                    $globalBlockIds[] = $gbId;
                }
            }
        }

        $globalBlocks = [];
        if (!empty($globalBlockIds)) {
            $globalBlocks = \TuranFurkan\CoreCms\Domains\GlobalBlock\Models\GlobalBlock::whereIn('id', array_unique($globalBlockIds))
                ->get()
                ->keyBy('id');
        }

        // Expand any global block references in a first pass
        $expandedBlocks = array_map(function ($block) use ($globalBlocks) {
            if (($block['type'] ?? '') === 'global_block_ref') {
                $gbId = $block['content']['global_block_id'] ?? null;
                if ($gbId && isset($globalBlocks[$gbId])) {
                    $gb = $globalBlocks[$gbId];
                    $block['type'] = $gb->type;
                    $block['content'] = $gb->content;
                    $block['styles'] = $gb->styles;
                }
            }
            return $block;
        }, $blocks);

        // Scan the expanded blocks for references
        $raceIds = [];
        $categoryIds = [];
        $postIds = [];
        $mediaIds = [];

        foreach ($expandedBlocks as $block) {
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
            } elseif (($block['type'] ?? '') === 'glassmorphic_grid') {
                $sourceType = $block['content']['source_type'] ?? 'category';
                $ids = $block['content']['entity_ids'] ?? [];
                if (is_array($ids)) {
                    if ($sourceType === 'category') {
                        $categoryIds = array_merge($categoryIds, $ids);
                    } elseif ($sourceType === 'race') {
                        $raceIds = array_merge($raceIds, $ids);
                    } elseif ($sourceType === 'post') {
                        $postIds = array_merge($postIds, $ids);
                    }
                }
            }
        }

        $races = [];
        if (!empty($raceIds)) {
            $races = \TuranFurkan\CoreCms\Domains\Race\Models\Race::with(['coverImage', 'categories'])
                ->whereIn('id', array_unique($raceIds))
                ->get()
                ->keyBy('id');
        }

        $categories = [];
        if (!empty($categoryIds)) {
            $categories = \TuranFurkan\CoreCms\Domains\Category\Models\Category::with(['coverImage'])
                ->withCount(['races', 'posts'])
                ->whereIn('id', array_unique($categoryIds))
                ->get()
                ->keyBy('id');
        }

        $posts = [];
        if (!empty($postIds)) {
            $posts = \TuranFurkan\CoreCms\Domains\Post\Models\Post::with(['coverImage', 'categories'])
                ->whereIn('id', array_unique($postIds))
                ->get()
                ->keyBy('id');
        }

        $mediaItems = [];
        if (!empty($mediaIds)) {
            $mediaItems = \TuranFurkan\CoreCms\Domains\Media\Models\MediaItem::whereIn('id', array_unique($mediaIds))
                ->get()
                ->keyBy('id');
        }

        return array_map(function ($block) use ($races, $categories, $posts, $mediaItems) {
            if (($block['type'] ?? '') === 'collection_display') {
                $content = $block['content'] ?? $block['data'] ?? [];
                $targetType = $content['target_content_type_id'] ?? 'blog';
                $limit = $block['styles']['limit'] ?? 3;

                if ($targetType === 'blog') {
                    $livePosts = \TuranFurkan\CoreCms\Domains\Post\Models\Post::published()
                        ->with(['coverImage', 'categories'])
                        ->orderBy('publish_date', 'desc')
                        ->orderBy('id', 'desc')
                        ->limit($limit)
                        ->get();
                    $block['hydrated_data'] = \TuranFurkan\CoreCms\Domains\Post\Http\Resources\PostResource::collection($livePosts)->toArray(request());
                } elseif ($targetType === 'races') {
                    $liveRaces = \TuranFurkan\CoreCms\Domains\Race\Models\Race::where('status', 'published')
                        ->with(['categories', 'coverImage'])
                        ->orderBy('order', 'asc')
                        ->orderBy('id', 'asc')
                        ->limit($limit)
                        ->get();
                    $block['hydrated_data'] = \TuranFurkan\CoreCms\Domains\Race\Http\Resources\RaceResource::collection($liveRaces)->toArray(request());
                }
            } elseif (($block['type'] ?? '') === 'sponsors_block') {
                $content = $block['content'] ?? $block['data'] ?? [];
                $sourceType = $content['source_type'] ?? 'manual';
                $categorySlug = $content['category_slug'] ?? '';

                if ($sourceType === 'dynamic') {
                    $query = \TuranFurkan\CoreCms\Domains\Partner\Models\Partner::where('status', 'published');
                    if ($categorySlug) {
                        $query->whereHas('categories', function ($q) use ($categorySlug) {
                            $q->where('slug->tr', $categorySlug)
                              ->orWhere('slug->en', $categorySlug);
                        });
                    }
                    $livePartners = $query->with(['categories', 'logo'])
                        ->orderBy('order', 'asc')
                        ->orderBy('id', 'desc')
                        ->get();
                    $block['hydrated_data'] = \TuranFurkan\CoreCms\Domains\Partner\Http\Resources\PartnerResource::collection($livePartners)->toArray(request());
                }
            } elseif (($block['type'] ?? '') === 'glassmorphic_grid') {
                $sourceType = $block['content']['source_type'] ?? 'category';
                $ids = $block['content']['entity_ids'] ?? [];
                $resolved = [];
                if (is_array($ids)) {
                    foreach ($ids as $id) {
                        if ($sourceType === 'category' && isset($categories[$id])) {
                            $resolved[] = (new \TuranFurkan\CoreCms\Domains\Category\Http\Resources\CategoryResource($categories[$id]))->toArray(request());
                        } elseif ($sourceType === 'race' && isset($races[$id])) {
                            $resolved[] = (new \TuranFurkan\CoreCms\Domains\Race\Http\Resources\RaceResource($races[$id]))->toArray(request());
                        } elseif ($sourceType === 'post' && isset($posts[$id])) {
                            if (class_exists('\TuranFurkan\CoreCms\Domains\Post\Http\Resources\PostResource')) {
                                $resolved[] = (new \TuranFurkan\CoreCms\Domains\Post\Http\Resources\PostResource($posts[$id]))->toArray(request());
                            } else {
                                $resolved[] = $posts[$id]->toArray();
                            }
                        }
                    }
                }
                $block['resolved_entities'] = $resolved;
            } elseif (($block['type'] ?? '') === 'entity_showcase') {
                $type = $block['data']['entity_type'] ?? '';
                $ids = $block['data']['entity_ids'] ?? [];
                $resolved = [];

                if (is_array($ids)) {
                    foreach ($ids as $id) {
                        if ($type === 'race' && isset($races[$id])) {
                            $resolved[] = (new \TuranFurkan\CoreCms\Domains\Race\Http\Resources\RaceResource($races[$id]))->toArray(request());
                        } elseif ($type === 'category' && isset($categories[$id])) {
                            $resolved[] = (new \TuranFurkan\CoreCms\Domains\Category\Http\Resources\CategoryResource($categories[$id]))->toArray(request());
                        }
                    }
                }
                $block['resolved_data'] = $resolved;
            } elseif (($block['type'] ?? '') === 'image') {
                $imgId = $block['data']['image_id'] ?? null;
                if ($imgId && isset($mediaItems[$imgId])) {
                    $block['resolved_image'] = (new \TuranFurkan\CoreCms\Domains\Media\Http\Resources\MediaResource($mediaItems[$imgId]))->toArray(request());
                }
            }
            return $block;
        }, $expandedBlocks);
    }
}
