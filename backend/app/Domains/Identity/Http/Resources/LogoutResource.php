<?php

namespace App\Domains\Identity\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LogoutResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'status' => 'success',
            'message' => $this['message'],
            'revoked_count' => $this['revoked_count'],
            'scope' => $this['scope'],
        ];
    }
}
