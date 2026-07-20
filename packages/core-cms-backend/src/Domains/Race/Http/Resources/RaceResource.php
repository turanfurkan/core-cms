<?php

namespace TuranFurkan\CoreCms\Domains\Race\Http\Resources;

use TuranFurkan\CoreCms\Domains\Category\Http\Resources\CategoryResource;
use TuranFurkan\CoreCms\Domains\Media\Http\Resources\MediaResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \TuranFurkan\CoreCms\Domains\Race\Models\Race
 */
class RaceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'name' => is_array($this->title) ? ($this->title['tr'] ?? $this->title['en'] ?? '') : $this->title,
            'slug' => $this->slug,
            'content' => $this->content,
            'start_date' => $this->start_date,
            'start_time' => $this->start_time,
            'location_embed' => $this->location_embed,
            'price' => $this->price,
            'discounted_price' => $this->discounted_price,
            'registration_deadline' => $this->registration_deadline,
            'max_participants' => $this->max_participants,
            'distance' => $this->distance,
            'start_point' => $this->start_point,
            'finish_point' => $this->finish_point,
            'elevation' => $this->elevation,
            'descent' => $this->descent,
            'cover_image_id' => $this->cover_image_id,
            'graphic_image_id' => $this->graphic_image_id,
            'gpx_file_id' => $this->gpx_file_id,
            'strava_file_id' => $this->strava_file_id,
            'gallery_ids' => $this->gallery_ids,
            'min_age' => $this->min_age,
            'max_age' => $this->max_age,
            'whats_included' => $this->whats_included,
            
            // Loaded relations
            'categories' => $this->relationLoaded('categories') && $this->categories
                ? CategoryResource::collection($this->categories)
                : [],
            'child_races' => $this->relationLoaded('childRaces') && $this->childRaces
                ? RaceResource::collection($this->childRaces)
                : [],
            'parent_races' => $this->relationLoaded('parentRaces') && $this->parentRaces
                ? RaceResource::collection($this->parentRaces)
                : [],
            
            // Loaded Media assets
            'cover_image' => $this->relationLoaded('coverImage') && $this->coverImage
                ? new MediaResource($this->coverImage)
                : null,
            'graphic_image' => $this->relationLoaded('graphicImage') && $this->graphicImage
                ? new MediaResource($this->graphicImage)
                : null,
            'gpx_file' => $this->relationLoaded('gpxFile') && $this->gpxFile
                ? new MediaResource($this->gpxFile)
                : null,
            'strava_file' => $this->relationLoaded('stravaFile') && $this->stravaFile
                ? new MediaResource($this->stravaFile)
                : null,
            'gallery' => (!empty($this->gallery_ids) && is_array($this->gallery_ids))
                ? MediaResource::collection(\TuranFurkan\CoreCms\Domains\Media\Models\MediaItem::whereIn('id', $this->gallery_ids)->get())
                : [],

            'youtube_embed' => $this->youtube_embed,
            'is_multi_race' => $this->is_multi_race,
            'manager_name' => $this->manager_name,
            'manager_phone' => $this->manager_phone,
            'is_sales_active' => $this->is_sales_active,
            'contest_id' => $this->contest_id,
            'is_free' => $this->is_free,
            'order' => $this->order,
            'status' => $this->status,
            'tabs' => $this->tabs ?? ($this->relationLoaded('categories') && $this->categories ? ($this->categories->first(fn($c) => !empty($c->tabs))?->tabs ?? []) : []),
            'has_custom_tabs' => !is_null($this->tabs),
            'raw_tabs' => $this->tabs,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
