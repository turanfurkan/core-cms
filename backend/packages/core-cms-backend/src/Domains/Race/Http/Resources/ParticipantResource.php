<?php

namespace TuranFurkan\CoreCms\Domains\Race\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \TuranFurkan\CoreCms\Domains\Race\Models\Participant
 */
class ParticipantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'identity_number' => $this->identity_number,
            'blood_type' => $this->blood_type,
            'phone_number' => $this->phone_number,
            'phone' => $this->phone_number,
            't_shirt_size' => $this->t_shirt_size,
            'shirt_size' => $this->t_shirt_size,
            'email' => $this->user?->email,
            'club_name' => $this->club_name,
            'nationality' => $this->nationality,
            'emergency_contact' => $this->emergency_contact,
            'emergency_phone_number' => $this->emergency_phone_number,
            'address' => $this->address,
            'user' => $this->relationLoaded('user') && $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null,
            
            // Loaded relations
            'registrations' => $this->relationLoaded('registrations') && $this->registrations
                ? RegistrationResource::collection($this->registrations)
                : [],
            
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
