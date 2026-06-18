<?php

namespace App\Domains\API\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApiKeyCreatedResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'hint' => $this->hint,
            'scopes' => $this->scopes,
            'raw_key' => $this->raw_key,
            'expires_at' => $this->expires_at ? $this->expires_at->toIso8601String() : null,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
