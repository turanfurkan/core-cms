<?php

namespace App\Domains\Identity\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domains\Identity\Models\Role
 */
class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->name,
            'name' => ucwords(str_replace('_', ' ', $this->name)),
            'guard_name' => $this->guard_name,
        ];
    }
}
