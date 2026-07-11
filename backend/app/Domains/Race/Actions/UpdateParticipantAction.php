<?php

namespace App\Domains\Race\Actions;

use App\Domains\Race\Models\Participant;

class UpdateParticipantAction
{
    public function execute(Participant $participant, array $data): Participant
    {
        $participant->update($data);
        return $participant;
    }
}
