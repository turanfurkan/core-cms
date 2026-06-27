<?php

namespace App\Domains\Race\Actions;

use App\Domains\Race\Models\Race;

class DeleteRaceAction
{
    public function execute(Race $race): bool
    {
        return (bool)$race->delete();
    }
}
