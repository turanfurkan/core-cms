<?php

namespace TuranFurkan\CoreCms\Domains\Race\Actions;

use TuranFurkan\CoreCms\Domains\Race\Models\Registration;

class UpdateRegistrationAction
{
    public function execute(Registration $registration, array $data): Registration
    {
        $registration->update($data);
        return $registration;
    }
}
