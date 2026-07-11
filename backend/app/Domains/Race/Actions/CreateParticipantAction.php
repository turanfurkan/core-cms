<?php

namespace App\Domains\Race\Actions;

use App\Domains\Race\Models\Participant;

class CreateParticipantAction
{
    public function execute(array $data): Participant
    {
        return Participant::create($data);
    }
}
