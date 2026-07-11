<?php

namespace App\Domains\Race\Actions;

use App\Domains\Race\Models\Participant;

class DeleteParticipantAction
{
    public function execute(Participant $participant): bool
    {
        return (bool) $participant->delete();
    }
}
