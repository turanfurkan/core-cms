<?php

namespace App\Domains\Race\Actions;

use App\Domains\Race\Models\Registration;

class UpdateRegistrationAction
{
    public function execute(Registration $registration, array $data): Registration
    {
        $registration->update($data);
        return $registration;
    }
}
