<?php

namespace TuranFurkan\CoreCms\Domains\Partner\Http\Resources;

use TuranFurkan\CoreCms\Domains\Category\Http\Resources\CategoryResource;
use TuranFurkan\CoreCms\Domains\Media\Http\Resources\MediaResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'link' => $this->link,
            'status' => $this->status,
            'order' => $this->order,
            'logo_id' => $this->logo_id,
            'logo' => $this->logo ? new MediaResource($this->logo) : null,
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
