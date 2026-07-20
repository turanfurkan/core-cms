<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Resources;

use TuranFurkan\CoreCms\Domains\Race\Http\Resources\ParticipantResource;
use TuranFurkan\CoreCms\Domains\Race\Http\Resources\RegistrationResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \TuranFurkan\CoreCms\Domains\Identity\Models\User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $firstRole = $this->roles->first();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'email_verified_at' => optional($this->email_verified_at)?->toAtomString(),
            'phone_verified_at' => optional($this->phone_verified_at)?->toAtomString(),
            'status' => $this->status,
            'avatar' => $this->getFirstMediaUrl('avatar') ?: null,
            'avatar_url' => $this->getFirstMediaUrl('avatar') ?: null,
            'is_trashed' => $this->trashed(),
            'isTrashed' => $this->trashed(),
            'createdAt' => optional($this->created_at)?->toAtomString(),
            'lastSignInAt' => \Spatie\Activitylog\Models\Activity::where('causer_id', $this->id)
                ->where('causer_type', $this->getMorphClass())
                ->where('log_name', 'user.login')
                ->latest()
                ->value('created_at')?->toAtomString(),
            'role' => $firstRole ? [
                'id' => (string) $firstRole->id,
                'name' => ucwords(str_replace(['_', '-'], ' ', $firstRole->name)),
            ] : null,
            'roles' => $this->getRoleNames()->values(),
            'participants' => ParticipantResource::collection($this->whenLoaded('participants')),
            'registrations' => RegistrationResource::collection($this->whenLoaded('registrations')),
        ];
    }
}
