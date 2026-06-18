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
            'name' => ucwords(str_replace(['_', '-'], ' ', $this->name)),
            'description' => $this->description,
            'isDefault' => (bool)$this->is_default,
            'isProtected' => (bool)$this->is_protected,
            'guard_name' => $this->guard_name,
            'permissions' => PermissionResource::collection($this->relationLoaded('permissions') ? $this->permissions : $this->permissions()->get()),
        ];
    }
}
