<?php

namespace App\Domains\Media\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domains\Media\Models\MediaItem
 */
class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'folder_id' => $this->folder_id,
            'name' => $this->name,
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'url' => $this->getUrl(),
            'webp_url' => $this->hasGeneratedConversion('webp') ? $this->getUrl('webp') : null,
            'metadata' => [
                'alt_text' => $this->getAltText(),
                'title' => $this->getTitle(),
                'description' => $this->getDescription(),
                'caption' => $this->getCaption(),
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
