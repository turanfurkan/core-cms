<?php

namespace App\Domains\Race\Http\Resources;

use App\Domains\Category\Http\Resources\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domains\Race\Models\Registration
 */
class RegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'participant_id' => $this->participant_id,
            'race_id' => $this->race_id,
            'user_id' => $this->user_id,
            'race_category_id' => $this->race_category_id,
            'bib_number' => $this->bib_number,
            'price' => $this->price,
            'status' => $this->status,
            'payment_id' => $this->payment_id,
            'group_id' => $this->group_id,

            // Loaded relations
            'participant' => $this->relationLoaded('participant') && $this->participant
                ? new ParticipantResource($this->participant)
                : null,
            'race' => $this->relationLoaded('race') && $this->race
                ? new RaceResource($this->race)
                : null,
            'category' => $this->relationLoaded('category') && $this->category
                ? new CategoryResource($this->category)
                : null,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
