<?php

namespace TuranFurkan\CoreCms\Domains\Race\Actions;

use TuranFurkan\CoreCms\Domains\Race\Models\Race;

class DeleteRaceAction
{
    public function execute(Race $race): bool
    {
        return (bool)$race->delete();
    }
}
