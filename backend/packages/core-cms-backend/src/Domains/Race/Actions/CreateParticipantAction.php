<?php

namespace TuranFurkan\CoreCms\Domains\Race\Actions;

use TuranFurkan\CoreCms\Domains\Race\Models\Participant;

class CreateParticipantAction
{
    public function execute(array $data): Participant
    {
        return Participant::create($data);
    }
}
