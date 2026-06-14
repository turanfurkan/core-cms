<?php

namespace App\Domains\Media\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domains\Media\Models\MediaFolder
 */
class FolderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'parent_id' => $this->parent_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'children' => FolderResource::collection($this->whenLoaded('children')),
            'media' => MediaResource::collection($this->whenLoaded('media')),
        ];
    }
}
