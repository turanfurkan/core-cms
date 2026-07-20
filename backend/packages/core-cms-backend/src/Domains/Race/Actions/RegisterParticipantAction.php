<?php

namespace TuranFurkan\CoreCms\Domains\Race\Actions;

use TuranFurkan\CoreCms\Domains\Race\Models\Registration;

class RegisterParticipantAction
{
    public function execute(array $data): Registration
    {
        return Registration::create($data);
    }
}
