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
            'parent_id' => $this->parent_id,
            'type' => $this->type,
            'order' => $this->order,
            'is_active' => $this->is_active,
            'parent' => new CategoryResource($this->whenLoaded('parent')),
            'children' => CategoryResource::collection($this->whenLoaded('children')),
            'races_count' => $this->races_count ?? 0,
            'field_settings' => $this->field_settings,
            'tabs' => $this->tabs ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
