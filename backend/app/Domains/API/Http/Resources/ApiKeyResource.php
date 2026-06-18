<?php

namespace App\Domains\API\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApiKeyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'hint' => $this->hint,
            'scopes' => $this->scopes,
            'expires_at' => $this->expires_at ? $this->expires_at->toIso8601String() : null,
            'is_active' => $this->is_active,
            'last_used_at' => $this->last_used_at ? $this->last_used_at->toIso8601String() : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
