<?php

namespace App\Domains\Content\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domains\Content\Models\ContentField
 */
class ContentFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type,
            'validation_rules' => $this->validation_rules,
            'options' => $this->options,
            'order' => $this->order,
        ];
    }
}
