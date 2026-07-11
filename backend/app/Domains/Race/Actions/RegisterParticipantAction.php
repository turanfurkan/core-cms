<?php

namespace App\Domains\Race\Actions;

use App\Domains\Race\Models\Registration;

class RegisterParticipantAction
{
    public function execute(array $data): Registration
    {
        return Registration::create($data);
    }
}
