<?php

namespace TuranFurkan\CoreCms\Domains\SEO\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeoMetadataResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'seoable_type' => $this->seoable_type,
            'seoable_id' => $this->seoable_id,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords,
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'og_image_id' => $this->og_image_id,
            'canonical_url' => $this->canonical_url,
            'meta_robots' => $this->meta_robots,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
