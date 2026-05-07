<?php

namespace App\Domains\User\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domains\User\Models\User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'email_verified_at' => optional($this->email_verified_at)?->toAtomString(),
            'phone_verified_at' => optional($this->phone_verified_at)?->toAtomString(),
            'roles' => $this->getRoleNames()->values(),
        ];
    }
}
