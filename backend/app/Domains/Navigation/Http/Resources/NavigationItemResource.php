<?php

namespace App\Domains\Navigation\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NavigationItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'type' => $this->type,
            'url' => $this->url,
            'linked_resource_type' => $this->linked_resource_type,
            'linked_resource_id' => $this->linked_resource_id,
            'target' => $this->target,
            'order' => $this->order,
            'is_active' => $this->is_active,
            'children' => self::collection($this->children),
        ];
    }
}
