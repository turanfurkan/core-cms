<?php

namespace App\Domains\Communication\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'template_code' => $this->template_code,
            'status' => $this->status,
            'scheduled_at' => $this->scheduled_at ? $this->scheduled_at->toIso8601String() : null,
            'sent_at' => $this->sent_at ? $this->sent_at->toIso8601String() : null,
            'summary' => $this->summary,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
        ];
    }
}
