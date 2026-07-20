<?php

namespace TuranFurkan\CoreCms\Domains\Race\Actions;

use TuranFurkan\CoreCms\Domains\Race\Models\Participant;

class UpdateParticipantAction
{
    public function execute(Participant $participant, array $data): Participant
    {
        $participant->update($data);
        return $participant;
    }
}
