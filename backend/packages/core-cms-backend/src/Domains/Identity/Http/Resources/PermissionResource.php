<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \TuranFurkan\CoreCms\Domains\Identity\Models\Permission
 */
class PermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->name,
            'name' => ucwords(str_replace(['.', '_'], ' ', $this->name)),
            'description' => $this->description,
            'guard_name' => $this->guard_name,
            'createdAt' => optional($this->created_at)?->toAtomString(),
        ];
    }
}
