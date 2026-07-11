<?php

namespace App\Domains\Category\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domains\Category\Models\Category
 */
class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image_id' => $this->image_id,
            'cover_image' => $this->relationLoaded('coverImage') && $this->coverImage
                ? (new \App\Domains\Media\Http\Resources\MediaResource($this->coverImage))->toArray($request)
                : null,
            'parent_id' => $this->parent_id,
            'earliest_race_date' => $this->relationLoaded('races') && $this->races->isNotEmpty()
                ? $this->races->first()->start_date
                : null,
            'countdown_race_name' => $this->relationLoaded('races') && $this->races->isNotEmpty()
                ? (($upcoming = $this->races->first(fn($r) => $r->start_date && \Carbon\Carbon::parse($r->start_date)->isFuture())) 
                    ? $upcoming->title 
                    : $this->races->last()->title)
                : null,
            'countdown_race_date' => $this->relationLoaded('races') && $this->races->isNotEmpty()
                ? (($upcoming = $this->races->first(fn($r) => $r->start_date && \Carbon\Carbon::parse($r->start_date)->isFuture())) 
                    ? $upcoming->start_date 
                    : $this->races->last()->start_date)
                : null,
            'type' => $this->type,
            'order' => $this->order,
            'is_active' => $this->is_active,
            'parent' => new CategoryResource($this->whenLoaded('parent')),
            'children' => CategoryResource::collection($this->whenLoaded('children')),
            'races' => \App\Domains\Race\Http\Resources\RaceResource::collection($this->whenLoaded('races')),
            'races_count' => $this->races_count ?? 0,
            'posts_count' => $this->posts_count ?? 0,
            'field_settings' => $this->field_settings,
            'tabs' => $this->tabs ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
