<?php

namespace TuranFurkan\CoreCms\Domains\Race\Actions;

use TuranFurkan\CoreCms\Domains\Race\Models\Participant;

class DeleteParticipantAction
{
    public function execute(Participant $participant): bool
    {
        return (bool) $participant->delete();
    }
}
